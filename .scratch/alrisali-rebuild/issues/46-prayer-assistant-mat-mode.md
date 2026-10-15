# 46: Prayer Assistant: Mat mode

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Phone face-up on the mat; luminance dips from the camera count sujud with per-device calibration.

**Blocked by:** 45 (Prayer Assistant: Camera and Head Height)

**Status:** done — pending device verification (fixtures are modelled; record real traces on a device)

- [ ] Domain detector tests with recorded luminance fixtures — the tests run the detector through luminance fixture sequences (`mat-fixtures.ts`: whole Fajr and Dhuhr, pass-bys, auto-exposure flicker and creep, flat ceiling, dark room, and a shallow sujud that only a kept dip catches). They are **modelled** on the old app's on-device measurements, not recorded. No phone has run Mat mode yet. Pending device: record real Y-plane traces and swap them in.
- [ ] Physical-device run counts sujud — pending device verification (Y-plane layout and stride, the exposure lock on iOS, Android frames, real dips)
