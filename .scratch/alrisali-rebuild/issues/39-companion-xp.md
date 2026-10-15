# 39: Companion XP

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Companion (Garden or Traveler) gains XP from logged Salah, completed Acts/Habits, Dhikr Sessions, Reading Completions and finished Lessons, with level-ups; awards are idempotent.

**Blocked by:** 05 (Prayer Log and Prayer Streak), 18 (Lessons and Slides), 28 (Favorites and Reading Completion), 32 (Tasbih al-Zahra and Dhikr Sessions), 34 (Habits), 36 (Acts for a date and Act Completion)

**Status:** done — pending simulator verification

- [x] Domain tests: each event awards once, thresholds (`packages/domain/src/companion/companion.test.ts`; repeats, relaunch and concurrent repeats in `packages/db-user/src/companion/repository.test.ts`; event wiring in `apps/native/features/companion/utils/xp-events.test.ts`)
- [ ] Level-up celebration (code complete: `CompanionAwards` at the root shows a success toast and haptic when an award crosses a level; pending simulator verification)
- [x] Syncing never double-awards (`packages/db-user/src/companion/sync.test.ts`: the same Salah awarded on two devices before either synced is counted once, against a local `tursodb --sync-server`)
