# 45: Prayer Assistant: Camera and Head Height

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** VisionCamera v5 frames run MoveNet Lightning via fast-tflite (CPU default) feeding the domain classifiers; preview hidden by default.

**Blocked by:** 44 (Prayer Assistant core and tap mode)

**Status:** ready-for-agent

- [x] Domain classifier tests with recorded keypoint fixtures (real MoveNet f16 outputs of the CC BY-SA "Намоз" photo series, `pose-fixtures.ts`; both engines, plus a recorded Fajr through the rak'ah machine)
- [ ] Physical-device run detects Positions — pending device verification (frame worklet, front-camera orientation/mirroring, in-loop latency, Android resizer)
- [x] Camera only while screen open (sensor mounted only while praying in Camera/Head Height mode; `isActive` follows the app foreground; session released on close; preview hidden unless "Show the camera")
