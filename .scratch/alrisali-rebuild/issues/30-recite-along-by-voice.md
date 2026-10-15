# 30: Recite-Along by voice

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Voice and hybrid Recite-Along using expo-speech-recognition (continuous, interim results, iOS restart loop) with an on-device availability check and fallback.

**Blocked by:** 29 (Recite-Along: hold and timed pace)

**Status:** done — pending device verification

- [ ] Voice advances words with real speech on device (code complete: Voice and Voice + hold methods; `useSpeechSession` in `apps/native/shared/lib/speech/speech-recognition.ts` runs ar-SA continuous recognition with interim results and restarts after every `end` (iOS ends on silence/final result); transcripts go through `createReciteMatcher` and a `heard` event in `reciteStep`, sharing one place with touch (tested in `progress.test.ts`); mic only in the foreground; pending physical-device verification, no native build run: disk constraints)
- [x] Unavailable on-device speech is explained with fallback to hold/auto (per-locale check: iOS `modules/speech-probe` Swift probe of `SFSpeechRecognizer(locale: ar-SA)`, Android installed locales of `com.google.android.as`; policy tested in `shared/lib/speech/speech-support.test.ts`; no recogniser, Dictation off, denied/restricted access, offline network recognition or repeated failures show a warning with the reason, retry and Settings, and the method falls back to hold with Auto selectable; network-only Arabic shows a notice that speech goes over the internet. Notice rendering pending simulator verification)
