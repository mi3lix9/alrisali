# 19: Library Assets

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Admins upload and publish Library Assets (PDF, audio, video, structured text, covers, categories, order); devices open them in viewers and resume position.

**Blocked by:** 16 (Gatherings and Speakers (with uploads))

**Status:** done — pending env: FILES_BUCKET*; pending simulator verification (needs a dev-client rebuild for react-native-pdf/expo-video)

- [ ] PDF, audio and video viewers work on device: built (react-native-pdf, expo-audio, expo-video, structured-text reader); pending simulator verification (needs a dev-client rebuild for the new native modules react-native-pdf, react-native-blob-util, expo-video); live files pending env: FILES_BUCKET, FILES_BUCKET_ENDPOINT, FILES_BUCKET_REGION, FILES_BUCKET_ACCESS_KEY_ID, FILES_BUCKET_SECRET_ACCESS_KEY
- [x] Reading/playback position resumes (domain `resumePosition` + per-user `library_asset_positions` tests; on-device feel pending simulator verification)
- [x] Unpublished assets never reach devices (router tests: drafts stay in the server DB, only published rows reach the replica, `/files` 404s their files)
