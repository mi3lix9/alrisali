# Prayer Assistant: native sensing stack for Expo SDK 58 (Oct 2026)

Tags: **[SRC]** = read in a primary source (link given). **[INFERENCE]** = my reasoning, not observed. **[UNVERIFIED]** = from memory or secondary sources; check before relying on it.

## 0. Platform baseline

- Expo SDK 58 ships React Native 0.88 RC. It was a beta from 15 Sep 2026, with a planned 3–4 week beta period. [SRC] https://expo.dev/changelog/sdk-58-beta
- You need a dev client or prebuild. None of the sensing libraries below run in Expo Go. Exception: expo-camera does run in Go, but it gives no frame access (see §1). [SRC] Expo camera docs, `platforms: [... 'expo-go']`.

## 1. Camera frames

| Option | Frame access | Notes |
| --- | --- | --- |
| **react-native-vision-camera v5** (latest release seen: 5.2.3, 2026-08-20) | Yes. `useFrameOutput({ pixelFormat, onFrame })` runs a worklet; `frame.getPlanes()` returns `FramePlane.getPixelBuffer()` | Built on Nitro Modules. Needs `react-native-nitro-modules`, `react-native-nitro-image`, `react-native-vision-camera-worklets` and `react-native-worklets`. For Expo: put the permissions in app.json, then prebuild. [SRC] https://visioncamera.margelo.com/docs , https://visioncamera.margelo.com/docs/frame-output , https://github.com/margelo/react-native-vision-camera/releases/tag/v5.2.3 |
| expo-camera (SDK 58) | **No.** It does preview, photo, video and barcode only. No frame-processor API is documented. | [SRC] https://docs.expo.dev/versions/v58.0.0/sdk/camera.md |
| Custom Expo Module (AVCaptureVideoDataOutput / CameraX ImageAnalysis) | Yes, at the native level | Most control, most work. Fallback if VC v5 breaks on RN 0.88. [INFERENCE] |

**Recommendation:** VisionCamera v5 with a `useFrameOutput` worklet.

Facts to design around:

- `pixelFormat: 'yuv'` uses about 2.6x less bandwidth than `'rgb'`. LiteRT converts YUV to RGB internally anyway, so docs recommend `'rgb'` when feeding a model. [SRC] frame-output docs.
- You **must call `frame.dispose()`** on every frame, or the buffer pool stalls. [SRC] frame-output docs.
- `getPixelBuffer()` does not copy, but it may trigger a GPU→CPU download. [SRC] https://visioncamera.margelo.com/api/react-native-vision-camera/hybrid-objects/FramePlane

## 2. Pose estimation

| Option | Offline iOS+Android | Keypoints | Works with VC v5? | Status |
| --- | --- | --- | --- | --- |
| **react-native-fast-tflite v3 + MoveNet SinglePose Lightning `.tflite`** | Yes | **Identical COCO-17**: same model family as today | Yes. The README shows a VC v5 example: `react-native-vision-camera-resizer` resizes to 192×192 RGB uint8, then `model.runSync`. Nitro HybridObjects need no boxing. | Maintained by Margelo. Expo config plugin options: `enableCoreMLDelegate`, `enableAndroidGpuLibraries`. Delegates: `core-ml`, `android-gpu`, `nnapi` (NNAPI is deprecated on Android 15). [SRC] https://raw.githubusercontent.com/margelo/react-native-fast-tflite/main/README.md |
| MediaPipe Pose Landmarker (community plugins, e.g. munishbp/react-native-mediapipe-pose-plugin 0.2.0) | Yes | 33 BlazePose points. COCO-17 is a subset via an index map, but the y-scale and confidences differ from MoveNet, so thresholds need retuning. | **No.** Written for VC v4 (`VisionCameraProxy.initFrameProcessorPlugin`, worklets-core). Validated only on RN 0.81 / SDK 54. Setup means hand-copying native files and Podfile linker hacks. | [SRC] https://raw.githubusercontent.com/munishbp/react-native-mediapipe-pose-plugin/main/README.md (its own README says other RN MediaPipe wrappers "hit unresolved iOS build issues") |
| ML Kit Pose via VC plugins (gev2002 / forks) | Yes | 33 points (BlazePose-based) | No. They are v3/v4 plugins. In v5, a native plugin must be rewritten as a Nitro HybridObject. | [SRC] https://visioncamera.margelo.com/docs/native-frame-processor-plugins , https://margelo.com/blog/whats-new-in-visioncamera-v5 ; repo https://github.com/gev2002/react-native-vision-camera-v3-pose-detection |
| Apple Vision `VNDetectHumanBodyPoseRequest` | iOS only | 19 joints (nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles, neck, root); maps to COCO-17 [UNVERIFIED] | Only via a custom Nitro plugin | Leaves Android uncovered, so it would need a second pipeline. |

**Recommendation:** fast-tflite + MoveNet Lightning. Your keypoint classifiers and calibration stay unchanged.

Notes:

- **Model sourcing:** the TF.js-format model you bundle today cannot be used. You need the TFLite build of `movenet/singlepose/lightning`, published on Kaggle Models (formerly tfhub.dev): `float16` or `int8`, input 192×192 uint8, output `[1,1,17,3]` as (y, x, score). [UNVERIFIED: exact URL and tensor shapes; inspect with Netron, as the fast-tflite README advises.]
- **Delegates:** the CoreML delegate does not support every op. If MoveNet falls back to CPU, CPU is still fast enough for Lightning [INFERENCE]. Benchmark `[]` vs `['core-ml']` vs `['android-gpu']` and choose per device.
- **Frame rate:** about 10–15 fps of inference is plenty for salah positions. Throttle inside the worklet by skipping frames, and still dispose skipped frames. [INFERENCE]
- **Front camera:** coordinates may be mirrored or rotated. Check `frame.orientation` / `isMirrored` before you map keypoints. [INFERENCE]

## 3. Mat mode: luminance per frame

**Cheapest approach:** VC v5 `useFrameOutput({ pixelFormat: 'yuv' })` with a sampled mean of plane 0 (Y, luma).

```ts
onFrame(frame) { 'worklet'
  try {
    const p = frame.getPlanes()[0];
    const y = new Uint8Array(p.getPixelBuffer());
    let s = 0, n = 0;
    for (let r = 0; r < p.height; r += 16)
      for (let c = 0; c < p.width; c += 16) { s += y[r * p.bytesPerRow + c]; n++; }
    onLuma(s / n);   // Worklets runOnJS / scheduleOnRN
  } finally { frame.dispose(); }
}
```

- This samples about 1–2k pixels per frame, which is trivial at 30 fps [INFERENCE]. Use the lowest resolution format available; nothing here needs 640px.
- Lock exposure if the API allows it. Auto-exposure will otherwise brighten the image during an occlusion and shrink the dip your detector looks for. [INFERENCE; VC v5 exposes `ExposureMode` per the issue #3743 file list]
- Optional: `react-native-vision-camera-resizer` to a 16×16 grey image, if the JS loop turns out slow.

**Sensor alternatives:**

- **iOS:** no public ambient-light API. The proximity sensor (`UIDevice.proximityMonitoringEnabled`) exists, but it blanks the screen and works only on the earpiece side. [UNVERIFIED]
- **Android:** `expo-sensors` LightSensor is Android-only [UNVERIFIED]. The proximity sensor fires on near/far, so it could detect sujud with no camera at all, but only if the phone lies face-up near the head. [INFERENCE]
- Neither option is cross-platform, so keep the camera approach.

## 4. Speech: takbir detection

**expo-speech-recognition (jamsch)**, main branch at version 57.1.1, devDependency on expo ~56. Versions now track the Expo SDK, so check for a 58.x release before upgrading. [SRC] https://raw.githubusercontent.com/jamsch/expo-speech-recognition/main/package.json

What its README documents:

| Feature | Details | Source |
| --- | --- | --- |
| Interim results | `interimResults: true` | [SRC] |
| Continuous mode | `continuous: true`. **Not supported on Android ≤12.** | [SRC] |
| On-device recognition | `requiresOnDeviceRecognition`, `supportsOnDeviceRecognition()` | [SRC] |
| Android offline models | `getSupportedLocales()` (Android 13+), then `androidTriggerOfflineModelDownload({ locale })`, which shows a system download dialog | [SRC] |
| Android service choice | `androidRecognitionServicePackage` (`com.google.android.as` / `com.google.android.tts`) | [SRC] |
| Android start/stop beep | Continuous mode works around the beep | [SRC] |
| iOS permissions | With on-device recognition you only need the microphone permission | [SRC] |

README: https://github.com/jamsch/expo-speech-recognition

- **Open issue #169:** on iOS the library _silently falls back to network recognition_ when on-device recognition is unavailable. Check `supportsOnDeviceRecognition()` before you promise offline mode. [SRC] https://github.com/jamsch/expo-speech-recognition/issues
- **iOS Arabic:**
  - `ar-SA` reportedly supports offline `SFSpeechRecognizer` [UNVERIFIED, secondary: https://medium.com/@toru_furuya/available-languages-in-on-device-speech-recognition-on-ios-in-2022-8c6383fac9f2].
  - iOS 26 `SpeechTranscriber` lists `ar_SA`, but developers report "transcription.ar asset not found after attempted download". [SRC] https://developer.apple.com/forums/thread/797835
- **Android Arabic offline:** depends on the Google on-device model being downloadable for `ar-SA` on that device. [UNVERIFIED; query at runtime with `getSupportedLocales`]
- **Matching:** your regex on interim results ports unchanged. Add `contextualStrings: ['الله أكبر']` as a bias (iOS) [SRC: the option exists in the README].

**Offline fallbacks:**

- **whisper.rn** (0.7.x on npm): whisper.cpp plus Silero VAD and a realtime transcriber. Arabic works with multilingual models. Whisper is not streaming; latency is a chunk of about 1–3 s, and battery cost is higher. [SRC: https://www.npmjs.com/package/whisper.rn ; latency is INFERENCE]
- **Vosk Arabic model:** a small grammar-restricted recognizer is ideal for one phrase. No maintained RN/Expo binding was verified. [UNVERIFIED]
- **Keyword spotting:** a custom TFLite KWS model for "Allahu Akbar" running through fast-tflite on mic PCM would be the most robust offline option. It needs training data. [INFERENCE]

## 5. Background, screen and privacy

- **Keep the screen on:** use `expo-keep-awake` (`useKeepAwake`). The camera session and recognizer stop when the app is backgrounded, and iOS forbids background camera use. Design the app as foreground-only. [INFERENCE / platform policy]
- **Privacy indicators:**
  - The green camera dot and orange mic dot (iOS), and the Android 12+ indicators, cannot be suppressed.
  - A hidden preview is fine: VC renders no preview unless you add one. [INFERENCE]
  - Expect user and App Review questions; explain the hidden camera in the UI.
- **Permission strings:**
  - iOS: `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, and `NSSpeechRecognitionUsageDescription` (only needed if network recognition is allowed).
  - Android: `CAMERA`, `RECORD_AUDIO`.
  - Set them through VC's app.json `infoPlist`/`permissions` and the expo-speech-recognition plugin. [SRC: VC docs; speech README]
- **Audio session:** the camera does not use the mic unless you add audio output. The recognizer owns the `AVAudioSession`. Avoid enabling VC audio. [INFERENCE]

## Recommended stack

1. `react-native-vision-camera@5` + `react-native-vision-camera-worklets` + `react-native-worklets` + `react-native-nitro-modules` + `react-native-nitro-image`
2. `react-native-fast-tflite@3` + `react-native-vision-camera-resizer` + MoveNet SinglePose Lightning `.tflite` (bundled asset; metro `assetExts: ['tflite']`)
3. Mat mode: the same frame output, with a YUV Y-plane sampled mean
4. `expo-speech-recognition` (`continuous`, `interimResults`, `requiresOnDeviceRecognition` when supported), with a whisper.rn fallback if offline Arabic is a hard requirement
5. `expo-keep-awake`; run only one camera consumer at a time

## Risks

- **R1.** VC v5 / Nitro has had iOS build failures (#3743: Xcode 26 beta on EAS, closed, but users still report it in 5.0.9). RN 0.88 RC support is not verified. Pin known-good versions and try a dev build early. [SRC] https://github.com/mrousavy/react-native-vision-camera/issues/3743
- **R2.** expo-speech-recognition has no confirmed SDK 58 release yet (main branch is 57.1.1). Its iOS on-device fallback is silent (#169).
- **R3.** Offline Arabic is not guaranteed on either OS. You need a runtime capability check and a UI fallback (manual tap or pose-only mode).
- **R4.** MoveNet `.tflite` output parsing: inference math must match tfjs (y/x order, 192px input, int8 vs float). Validate against recorded web-app sessions.
- **R5.** Front-camera mirroring and orientation can flip left/right keypoints.
- **R6.** Auto-exposure undermines mat-mode dip detection; lock exposure or recalibrate.
- **R7.** Android ≤12 has no continuous recognition; you need a restart loop.
- **R8.** No v5-compatible ML Kit or MediaPipe pose plugins exist; switching to either means writing a Nitro plugin.
