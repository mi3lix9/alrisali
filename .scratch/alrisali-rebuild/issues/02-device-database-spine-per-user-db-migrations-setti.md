# 02: Device database spine: per-user DB, migrations, settings

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Each Believer (Guest included) gets one local database opened sync-ready (Turso RN sync with the documented native patch, url function returning null, bootstrap off), Drizzle via sqlite-proxy, bundled additive migrations with a schema_version row, a repository API, and TanStack Query invalidation after writes/pulls. First entity: Believer settings — location and Calculation Method — editable in Settings and persisted across relaunch.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** ready-for-agent

- [ ] Settings location and Calculation Method survive app relaunch on iOS
- [ ] Migrations run before any push; schema_version recorded
- [ ] Repository API tests (seam 2) pass against a local database
- [ ] Guest database is opened in sync mode with no URL and does not attempt network
- [ ] Patch for @tursodatabase/sync-react-native applied via patchedDependencies and builds on SDK 58
