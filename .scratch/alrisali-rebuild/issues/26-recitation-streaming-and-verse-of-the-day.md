# 26: Recitation streaming and Verse of the Day

**Parent:** docs/issues/0000-alrisali-rebuild.md (Quran detail: 0001-quran-reader.md)

**What to build:** Stream recitation from the Quran Foundation audio API with a reciter choice, play from the first visible ayah, cache played files ≤7 days, and the Verse of the Day card with audio.

**Blocked by:** 23 (Quran reader: Page Mode, Surah Mode, full-screen controls)

**Status:** done — pending env: QF_CLIENT_ID, QF_CLIENT_SECRET; pending simulator verification (expo-audio added: needs a native dev-client rebuild)

- [x] Playback from first visible ayah (`recitationStart`: Page Mode = first ayah printed on the page, Surah Mode = ayah scrolled to the top; the pill plays on across surahs; tested in `@alrisali/domain/quran`)
- [x] Cache expires after 7 days (`createRecitationCache` over the app cache directory; tested with a fake store and clock)
- [x] Attribution shown in Sources & Credits (`quran-foundation` entry: "Quran data provided by Quran.Foundation")
- [ ] Live stream from Quran Foundation on a device (server client tested against a fake QF OAuth2/Content API; pending env: QF_CLIENT_ID, QF_CLIENT_SECRET; pending simulator verification)
