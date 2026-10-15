# 26: Recitation streaming and Verse of the Day

**Parent:** docs/issues/0000-alrisali-rebuild.md (Quran detail: 0001-quran-reader.md)

**What to build:** Stream recitation straight from free, key-less sources (alquran.cloud, EveryAyah.com for reciters it lacks) with a bundled reciter choice, play from the first visible ayah, cache played files ≤7 days, and the Verse of the Day card with audio.

**Blocked by:** 23 (Quran reader: Page Mode, Surah Mode, full-screen controls)

**Status:** done — pending simulator verification (expo-audio added: needs a native dev-client rebuild)

- [x] Playback from first visible ayah (`recitationStart`: Page Mode = first ayah printed on the page, Surah Mode = ayah scrolled to the top; the pill plays on across surahs; tested in `@alrisali/domain/quran`)
- [x] Cache expires after 7 days (`createRecitationCache` over the app cache directory; tested with a fake store and clock)
- [x] Attribution shown in Sources & Credits (`alquran-cloud` and `everyayah` entries, noting the recordings' copyrights belong to the reciters)
- [ ] Live stream on a device (URLs built by `recitationUrl`, tested in `@alrisali/domain/quran`; pending simulator verification)
