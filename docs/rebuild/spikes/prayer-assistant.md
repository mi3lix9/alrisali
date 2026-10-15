# Spike 3: Prayer Assistant sensing stack on Expo SDK 58

**Verdict: PARTIAL.** Stack recommendation: **go-with-risks.**

- iOS simulator build: PASS.
- MoveNet still-image inference through fast-tflite: PASS. It matches the host LiteRT reference exactly.
- ar-SA speech recognition (network mode): PASS. It streamed interim Takbir results on the simulator.
- Camera frame worklet (luminance and MoveNet): **not verified on any platform.**
- Android: **not verified** (skipped by user decision; disk constraints).

## Platform status

| Platform | Build | Runtime |
| --- | --- | --- |
| iOS simulator `alrisali-spike3` (iPhone 18 Pro, iOS 27.0 runtime, Xcode 27.0) | **PASS** (`logs/build-ios-3.log`) after installing the Metal Toolchain (see below) | Still inference and speech verified. The simulator has no camera ("camera: no device"), so the frame worklet never ran. |
| Android Pixel_Fold_API_36 | **not verified (skipped by user decision; disk constraints)** | Not run |

Android details:

- The first `./gradlew assembleDebug` failed with `java.io.IOException: No space left on device` because the disk was full (`logs/build-android-1.log`).
- The second attempt got through Gradle configuration of every Nitro module ("VisionCameraResizer is boosted by nitro!" and the rest) and the expo plugin jars. I cancelled it at that point when the user decided to stop all Android work (`logs/build-android-2.log`).
- The emulator never booted: `FATAL | Your device does not have enough disk space to run avd: Pixel_Fold_API_36`.
- Android build outputs were deleted afterwards.

### Build failures and fixes (verbatim)

1. **iOS, attempt 2:**

   ```
   ❌  error: error: cannot execute tool 'metal' due to missing Metal Toolchain; use: xcodebuild -downloadComponent MetalToolchain
   ```

   The trigger is `node_modules/react-native-vision-camera-resizer/ios/Metal/ResizerKernels.metal`, compiled in target `VisionCameraResizer-VisionCameraResizerShaders`.

   **Fix:** run `xcodebuild -downloadComponent MetalToolchain`. That downloads 838.9 MB and installs "Metal Toolchain 27A266a". After that the build succeeded with 0 errors.

   ⇒ **This is a prerequisite on every dev machine and every CI/EAS macOS image** that builds the app, as long as it uses `react-native-vision-camera-resizer`. Xcode 27 does not ship the Metal toolchain by default.

2. **Disk space:** a full disk (853 MB → 113 MB free) killed the first Android and iOS attempts. This was environmental, not caused by the stack.
3. No other build errors. There were 637 warnings in `xcodebuild` (`logs/xcodebuild-ios-3.log`), none of them blocking.

## Exact versions

`expo` latest was still 57.0.29; SDK 58 came from the `next` tag / `blank-typescript@sdk-58` template.

| Package | Version |
| --- | --- |
| expo | 58.0.10 |
| react-native | 0.88.0-rc.4 (pinned by the template; `next` on npm is 0.88.0-rc.6) |
| react | 19.3.0 |
| expo-dev-client | 58.0.13 |
| expo-keep-awake | 58.0.3 |
| expo-build-properties | 58.0.10 (Android `minSdkVersion: 26`, required by vision-camera-resizer) |
| react-native-vision-camera / -worklets / -resizer | 5.2.3 / 5.2.3 / 5.2.3 |
| react-native-worklets | 0.13.0 (peer `react-native: 0.86 - 0.88`) |
| react-native-nitro-modules | 0.37.1 |
| react-native-nitro-image | 0.15.2 |
| react-native-fast-tflite | 3.0.1 (plugin: `enableCoreMLDelegate: true`, `enableAndroidGpuLibraries: true` → `$EnableCoreMLDelegate=true` in Podfile; `<uses-native-library libOpenCL.so>` in the manifest) |
| expo-speech-recognition | 57.1.1 |
| Xcode | 27.0 (build 27A…); Metal Toolchain 27A266a |

**SDK 58 compatibility of expo-speech-recognition:**

- No 58.x release exists. The latest is v57.1.1 (2026-10-08) on npm and GitHub, and its devDependency is expo `~56.0.12`.
- Its peer dependencies are `*`, so installing it gave only bun peer warnings for RN 0.88 RC.
- It compiled and ran on SDK 58 iOS without patches.
- On Android it is untested on SDK 58.

## Model

- **Source:** Kaggle Models `google/movenet`, TFLite variations. These are the former tfhub.dev URLs.
  - `https://www.kaggle.com/api/v1/models/google/movenet/tfLite/singlepose-lightning-tflite-float16/1/download` → tar.gz containing `4.tflite`
  - `https://www.kaggle.com/api/v1/models/google/movenet/tfLite/singlepose-lightning-tflite-int8/1/download` → tar.gz containing `4.tflite`
  - The download needs no auth.
- **License:** Apache 2.0. Verified through `GET https://www.kaggle.com/api/v1/models/google/movenet/get`: every tfLite instance reports `licenseName: "Apache 2.0"`.
- **Files:**
  - `assets/models/movenet_lightning_f16.tflite`: 4,758,512 B, sha256 `0fac2226…dd135ab`
  - `assets/models/movenet_lightning_int8.tflite`: 2,894,840 B, sha256 `cd7cc22f…91bb105`
- **Tensors.** Read from LiteRT on the host (`tools/ref.py`) and from fast-tflite `model.inputs/outputs` on the device; both agree.
  - input `serving_default_input:0`: `uint8 [1,192,192,3]` (RGB, 0–255, no normalisation)
  - output `StatefulPartitionedCall:0`: `float32 [1,1,17,3]` = (y, x, score) per COCO-17 keypoint, normalised 0–1

## Still-image inference (outside the camera)

**Image:** Wikimedia Commons, "File:Pyei Sandy.jpg" by Shwemyotaw, **public domain** (own work). https://commons.wikimedia.org/wiki/File:Pyei_Sandy.jpg

**Preprocessing:** the 960×1440 version was letterboxed to square (240 px black bars left and right) and bilinear-resized to 192×192. `tools/ref.py` wrote the raw RGB bytes to `assets/standing_192x192_rgb.bin` (110,592 B). The app loads that file with fast-tflite's own Nitro `AssetLoader` and calls `model.runSync([buf])`.

On-device output, iOS simulator, f16 model, CPU (`logs/metro-ios.log`). It is identical to the host LiteRT reference (`tools/ref_output.txt`) to 3 decimals:

```
nose            y=0.201 x=0.467 s=0.70   (host: 0.201 0.467 0.70 → image px (433,289) = face)
left_eye        y=0.183 x=0.479 s=0.52
right_eye       y=0.174 x=0.454 s=0.56
left_ear        y=0.171 x=0.463 s=0.65
right_ear       y=0.152 x=0.407 s=0.80
left_shoulder   y=0.268 x=0.458 s=0.82
right_shoulder  y=0.242 x=0.331 s=0.64
left_elbow      y=0.411 x=0.479 s=0.76
right_elbow     y=0.376 x=0.254 s=0.85
left_wrist      y=0.414 x=0.576 s=0.50
right_wrist     y=0.464 x=0.328 s=0.61
left_hip        y=0.514 x=0.437 s=0.82
right_hip       y=0.518 x=0.343 s=0.83
left_knee       y=0.664 x=0.535 s=0.77
right_knee      y=0.731 x=0.397 s=0.59
left_ankle      y=0.804 x=0.422 s=0.62
right_ankle     y=0.881 x=0.398 s=0.82   (→ image px (333,1269) = shoes)
```

The coordinates are sane: y runs head → ankles from 0.15 to 0.88. Mapped back onto the photo, the points land on the face, hips and shoes.

### Timing (iOS simulator on the M-series host, so not representative of a phone)

20 runs after warm-up. Run 1 overlapped the Xcode build; run 2 is the clean figure.

| Model | Delegate | Load time | Median (run 2) | Output |
| --- | --- | --- | --- | --- |
| f16 | CPU | 9.8 ms | 5.71 ms | correct |
| f16 | core-ml | 97.5 ms | 9.77 ms | **CORRUPT**: scores correct, but y/x are `-0.000` / `2e13` (run 1) or `0.000` (run 2) |
| int8 | CPU | 8.6 ms | 7.90 ms | correct: same coordinates as host ±0.01; scores differ from host int8 (e.g. nose 0.88 vs 0.70) |
| int8 | core-ml | 8.7 ms | 7.90 ms | identical to int8 CPU. [INFERENCE] CoreML did not take the int8 graph, so it fell back to CPU. |

**Finding:** with the f16 model, the CoreML delegate returned garbage coordinates on the simulator. It must be re-tested on a physical iPhone, where CoreML uses the ANE/GPU. Until then, use CPU (`[]`), which is already sub-10 ms.

## Camera frame output (luminance + MoveNet)

The worklet is implemented in `App.tsx` (`useFrameOutput`):

- `pixelFormat: 'yuv'`, 640×480.
- (a) Mean of the Y plane, sampled 1/16 in each axis.
- (b) A GPU `Resizer` (192×192, `rgb`, `uint8`, `interleaved`, `contain`) feeding `model.runSync`. If `isResizerAvailable()` is false, it falls back to a CPU nearest-neighbour Y→grey RGB.
- It aggregates and calls `scheduleOnRN` every 500 ms (2 Hz), with `frame.dispose()` in a `finally` block.

**Verified:**

- The code type-checks (`tsc --noEmit`) and compiles into the iOS build.
- `isResizerAvailable()` returns `true` on the iOS simulator.
- `createResizer` resolved without error.

**NOT verified:**

- No `FRAME` log line was ever produced, on either platform. The iOS simulator exposes no camera device ("camera: no device" in `logs/ios-screen-2.png`), and the Android emulator was never booted.
- So none of these was observed: luminance values, in-camera inference time, whether capturing a Nitro `TfliteModel`/`Resizer` in the VC worklet runtime works, Y-plane stride/layout, and frame drops.

## Speech (expo-speech-recognition, iOS simulator)

Capabilities (`logs/metro-ios.log`, `logs/ios-screen-2.png`):

```
isRecognitionAvailable: true
supportsOnDeviceRecognition(): false
getSupportedLocales: 62 locales, Arabic = ["ar-SA"]
probe(ar-SA): recognizer ✓, isAvailable ✓, supportsOnDeviceRecognition false
probe(en-US): supportsOnDeviceRecognition false
```

The `probe` rows come from a local Expo module in this spike (`modules/speech-probe`).

**Library gaps found by reading its source (`ios/ExpoSpeechRecognitionModule.swift`):**

- **`supportsOnDeviceRecognition()` ignores locale.** It uses `SFSpeechRecognizer()`, the device locale, so it cannot answer the ar-SA question. The production app needs its own per-locale check, as the probe module here does. The probe is about 15 lines of Swift.
- **iOS `getSupportedLocales().installedLocales` is fake:** it is a copy of `locales`.
- **Silent network fallback (issue #169) confirmed in code:** `if recognizer.supportsOnDeviceRecognition { request.requiresOnDeviceRecognition = … }` (ExpoSpeechRecognizer.swift:588).

**Live recognition:**

- Call: `start({lang:'ar-SA', continuous:true, interimResults:true, contextualStrings:['الله أكبر']})`.
- Permission: the speech permission dialog was tapped via `axe`. `simctl privacy grant speech-recognition` fails with "Failed to create TCC authorization record".
- **Run 1, silence:** `start` → `audiostart` → `end` after about 7 s.
  - System log: `kAFAssistantErrorDomain Code=203 "Retry"` / `SiriSpeechErrorDomain Code=1`.
  - **No `error` event was emitted to JS.**
- **Run 2:** the host Mac played `say -v Majed "الله أكبر"` 12 times through the speakers into the simulator's (host) mic. Interim results streamed:
  ```
  result final=false ["‏الله"]
  result final=false ["‏الله أكبر"]
  … result final=false ["‏الله أكبر الله أكبر قل هو الله …"]
  result final=true  [...]   then  end
  ```
  - Recognition was network-based, because on-device is false.
  - The transcript includes ambient speech the mic picked up.
  - **Transcripts start with U+200F (RLM).** The Takbir regex must strip or ignore it.
  - Even with `continuous: true`, the session ended after one final result (≈40 s). The app needs a restart loop on iOS too, not only on Android ≤12.

Android speech: not verified (skipped by user decision; disk constraints).

## Needs a physical device

- Camera frame worklet on **both** platforms: luminance values, MoveNet in-loop latency, frame drops, front-camera mirroring/orientation, and exposure lock.
- CoreML delegate correctness and speed for the f16 model (corrupt on the simulator), plus `android-gpu`.
- On-device ar-SA: iOS `SFSpeechRecognizer(locale: ar-SA).supportsOnDeviceRecognition`, and Android `getSupportedLocales({androidRecognitionServicePackage:'com.google.android.as'}).installedLocales` / `androidTriggerOfflineModelDownload`.
- All Android builds and runtime.

## Verdict on the stack: **go-with-risks**

What works on SDK 58 / RN 0.88 RC (iOS):

- VisionCamera v5 + worklets + resizer + Nitro build cleanly.
- fast-tflite v3 runs MoveNet Lightning with output identical to the reference.
- expo-speech-recognition 57.1.1 recognises Arabic "الله أكبر" with interim results.

Risks:

1. **The camera frame path is unproven.** It is the core of the feature. Gate it with the next device run; Spike 1/2 owners or a physical device would settle it quickly.
2. The Metal Toolchain is required on dev and CI machines.
3. The CoreML delegate corrupts f16 output on the simulator, so default to the CPU delegate.
4. Offline Arabic was not available on the iOS simulator. The library's on-device check is locale-blind and its fallback is silent, so the app needs its own probe module plus UI fallbacks.
5. iOS sessions end despite `continuous`, so add a restart loop. No-speech failures surface only as `end`, never as `error`.
6. expo-speech-recognition has no SDK 58 release yet.
7. Android is entirely unverified.

Alternatives, if the device run fails:

- **Frame path:** a custom Expo Module (AVCaptureVideoDataOutput / CameraX ImageAnalysis) computing luminance natively and running TFLite via fast-tflite's C++ model. Or Apple Vision body pose on iOS.
- **Speech:** whisper.rn or a custom KWS TFLite model for offline Takbir.

## Commands run (key)

```
bunx create-expo-app@latest prayer-assistant --template blank-typescript@sdk-58 --no-install
bun install; bunx expo install expo-dev-client expo-keep-awake expo-asset expo-build-properties react-native-worklets
bun add react-native-vision-camera@5.2.3 react-native-vision-camera-worklets@5.2.3 react-native-vision-camera-resizer@5.2.3 \
  react-native-nitro-modules react-native-nitro-image react-native-fast-tflite@3.0.1 expo-speech-recognition@57.1.1
xcrun simctl create alrisali-spike3 com.apple.CoreSimulator.SimDeviceType.iPhone-18-Pro com.apple.CoreSimulator.SimRuntime.iOS-27-0
CI=1 bunx expo prebuild --clean
xcodebuild -downloadComponent MetalToolchain
CI=1 bunx expo run:ios --device alrisali-spike3 --no-bundler
CI=1 bunx expo start --dev-client --port 8093
xcrun simctl openurl alrisali-spike3 "exp+prayer-assistant://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8093"
(host) uv venv; uv pip install ai-edge-litert pillow numpy; python tools/ref.py movenet_lightning_f16.tflite movenet_lightning_int8.tflite
```

## Artifacts

- `logs/`: build logs, `metro-ios.log` (all `[PA ios]` output), simulator screenshots, `xcodebuild-ios-3.log`.
- `tools/`: `ref.py` (host reference and input generator) and `ref_output.txt`.
- `modules/speech-probe/`: per-locale SFSpeechRecognizer probe (iOS).

Cleanup: DerivedData (2.5 GB), `ios/build`, all Android build outputs and the Gradle daemon were removed. Metro and the simulator were stopped.
