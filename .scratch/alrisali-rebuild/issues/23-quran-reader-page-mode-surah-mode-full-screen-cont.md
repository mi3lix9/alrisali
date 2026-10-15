# 23: Quran reader: Page Mode, Surah Mode, full-screen controls

**Parent:** docs/issues/0000-alrisali-rebuild.md (Quran detail: 0001-quran-reader.md)

**What to build:** The Quran reader model plus the full reader per spec 0001: full-screen Page Mode (horizontal or vertical setting, justified lines, headers, rosettes, juz/hizb/page footer), Surah Mode with Next Surah, and tap-to-show controls that auto-hide.

**Blocked by:** 22 (Quran data build and basic Page Mode)

**Status:** done — pending simulator verification

- [x] Reader model tests: navigation bounds, chrome state machine transitions — `@alrisali/domain/quran` (`packages/domain/src/quran/`): `reader.test.ts` (page/ayah lookup at 1:1, 2:1, 114:6, page 604; juz and hizb per page; page bounds 1–604, surah bounds 1–114, the Surah Mode end state with Next Surah; paging, Surah Mode scrolling and mode switches both ways keep the ayah) and `chrome.test.ts` (tap toggle, 4 s inactivity with fake timers, swipe/scroll start, pinning by a sheet and the scrubber, long-press opens the ayah sheet without toggling). Hizb comes from data: `HIZB_QUARTER_STARTS` in `@alrisali/content/quran` (Tanzil metadata, CC BY 3.0, corrected to KFGQPC's ۞ signs; integrity test + credit + `notices/tanzil.md`).
- [ ] Swipe RTL and vertical scroll both work — built: `/quran` is full screen (no header, tabs or status bar); Page Mode horizontal is a right-to-left pager (next page to the left), vertical a virtualised list of pages; the setting lives in the reader settings sheet and in Settings (`quran_reader_settings` in the per-user DB, with Surah Mode and its font size). Lines are measured and spread edge to edge; header band, basmala, rosettes from the KFGQPC font, juz/surah header and page/hizb footer. iOS JS bundle exports. Pending simulator verification.
- [ ] Long-press opens the ayah sheet; tap toggles controls — built on the model above (word-level long-press → ayah sheet with selectable text, Share and the Favorites heart, composed in `app/quran.tsx` through the `ayahActions` slot, which tickets 24 and 26 extend with Set as last read and Play; tap anywhere toggles the top bar; one-time hint). Pending simulator verification.
- [ ] Dark mode pure black — reader surfaces use `dark:bg-black` with the theme's off-white foreground. Pending simulator verification.
