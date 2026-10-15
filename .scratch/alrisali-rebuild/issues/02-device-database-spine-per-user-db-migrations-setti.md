# 02: Device database spine: per-user DB, migrations, settings

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Each Believer (Guest included) gets one local database opened sync-ready (Turso RN sync with the documented native patch, url function returning null, bootstrap off), Drizzle via sqlite-proxy, bundled additive migrations with a schema_version row, a repository API, and TanStack Query invalidation after writes/pulls. First entity: Believer settings — location and Calculation Method — editable in Settings and persisted across relaunch.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** done — pending simulator verification

- [ ] Settings location and Calculation Method survive app relaunch on iOS — Settings has Location and Calculation Method cards backed by the `believer_settings` table; the repository relaunch test (close + reopen the same file) passes, and the iOS JS bundle exports. Pending simulator verification (no native build: disk).
- [x] Migrations run before any push; schema_version recorded (`packages/db-user/src/shared/migrate.ts`; tested in `user-database.test.ts`, including a push that sees the recorded version, idempotent re-apply after a pull, rollback, no downgrade)
- [x] Repository API tests (seam 2) pass against a local database (Node `@tursodatabase/sync` 0.8.3, the same engine, behind the device's `SyncedConnection` interface)
- [x] Guest database is opened in sync mode with no URL and does not attempt network (`url: () => null`, `bootstrapIfEmpty: false`; `sync()` is paused with no fetch; Guest writes are change-tracked)
- [ ] Patch for @tursodatabase/sync-react-native applied via patchedDependencies and builds on SDK 58 — applied (`patches/`, root `patchedDependencies`; patched `TursoModule.mm` verified in node_modules); same patch and versions as the spike's passing iOS build. Pending simulator verification of this repo's native build (no native build: disk).
