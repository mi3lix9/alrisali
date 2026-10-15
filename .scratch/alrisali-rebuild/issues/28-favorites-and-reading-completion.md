# 28: Favorites and Reading Completion

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Believers favourite Surahs, Supplications and Library Assets and mark a Supplication read today; Favorites appear in the Library.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings), 27 (Books data and Supplication reader)

**Status:** done — pending simulator verification

- [x] Favorites and Reading Completions persist and sync (`packages/db-user/src/favorites/repository.test.ts`, `packages/db-user/src/reading-completion/repository.test.ts`: kept across relaunch; ids derived from the item / Supplication + day so the same Favorite or same-day reading on two devices merges into one row. Checked once against a local `tursodb --sync-server`: Guest rows pushed after sign-in, a second device pulled them, a removal and a repeat favourite reached the other device. Live cloud sync rides ticket 11's `remoteUrl`.)
- [ ] Guest can use both (code complete: repositories tested on a Guest database (no URL); Supplication reader has a Favorite heart in the header and "Mark as read today" (undoable) after the text; Library shows Favorites (Surahs, ayat, Supplications) newest first; iOS JS bundle exports; pending simulator verification)

Notes: Kinds are `surah`, `ayah`, `supplication`, `library-asset` (`@alrisali/domain/favorites`). No in-reader control for Surahs/ayat yet: the Quran reader (tickets 23–25) composes `FavoriteButton` from `@/features/favorites` through its route. Library Asset Favorites are stored but not listed until ticket 19 can name them. Details: alrisali-notes/ticket-28-favorites-and-reading-completion.md.
