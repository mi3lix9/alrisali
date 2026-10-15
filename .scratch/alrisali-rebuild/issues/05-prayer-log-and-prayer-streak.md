# 05: Prayer Log and Prayer Streak

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Believers tick each Salah for today or any past date (not future), confirm before un-ticking, and see their Prayer Streak — always derived from logs, including after edits — on the Prayer tab and as quick ticks on Home.

**Blocked by:** 04 (Prayer Times timetable and next-Salah countdown)

**Status:** ready-for-agent

- [x] Domain tests: streak for complete/incomplete days, gaps, past edits — `prayerStreak` in `@alrisali/domain/prayer-log` (derived, never stored; 0 unless the end date is complete), tested for empty, complete runs, incomplete end day, gaps, later days ignored, month/year boundaries, a past day completed later joining two runs, a past un-tick breaking the run
- [x] Editing a past day updates the streak instantly — the streak is recomputed from all Prayer Logs on every render; `useSetSalahPerformed` updates the query cache optimistically (rolled back on failure). Visual check pending simulator verification
- [x] Future dates cannot be logged — `createPrayerLogRepository.setPerformed` throws `FutureDateError` and saves nothing (seam-2 test); the Prayer tab's day stepper stops at today
- [x] Un-tick asks for confirmation — ticking is immediate, un-ticking goes through a destructive `Alert.alert` (Prayer tab card and Home quick ticks). Visual check pending simulator verification
