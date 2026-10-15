# 24: Last-Read Ayah, Continue reading, favourite ayat

**Parent:** docs/issues/0000-alrisali-rebuild.md (Quran detail: 0001-quran-reader.md)

**What to build:** Last-Read Ayah updates on paging/scrolling or explicit set, survives relaunch, is shared by both modes and shown in Continue reading on Home and Library; ayat can be favourited and found in Favorites.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings), 23 (Quran reader: Page Mode, Surah Mode, full-screen controls)

**Status:** ready-for-agent

- [ ] Reader model tests: last-read transitions incl. mode switch
- [ ] Relaunch reopens at the Last-Read Ayah
- [ ] Favourite ayat persist and sync
