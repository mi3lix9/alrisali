# 24: Last-Read Ayah, Continue reading, favourite ayat

**Parent:** docs/issues/0000-alrisali-rebuild.md (Quran detail: 0001-quran-reader.md)

**What to build:** Last-Read Ayah updates on paging/scrolling or explicit set, survives relaunch, is shared by both modes and shown in Continue reading on Home and Library; ayat can be favourited and found in Favorites.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings), 23 (Quran reader: Page Mode, Surah Mode, full-screen controls)

**Status:** done — pending simulator verification

- [x] Reader model tests: last-read transitions incl. mode switch
- [x] Relaunch reopens at the Last-Read Ayah (saved in `quran_last_read`, `openReader` falls back to it; on-device check pending simulator verification)
- [x] Favourite ayat persist and sync (checked against local `tursodb --sync-server`; on Turso Cloud a Guest's favourite ayah reaches the Believer's Cloud database after sign-in, `apps/server/src/turso-cloud.live.test.ts`)
