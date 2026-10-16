---
status: accepted. The local iOS spike passed (docs/rebuild/spikes/turso-sync.md), and the production code path passes against a local sync server and against Turso Cloud, read-only content token included (Evidence below). Android is still unverified.
---

# Each Believer has their own Turso database, synced with one on the device

Every Believer's records (Prayer Logs, Khushu, Habits, Subscriptions, Act Completions, Tasbih, Dhikr Sessions, Mood Check-ins, Favorites, Reading Completions, settings) live in one database on the device. When they sign in, it syncs with a Turso cloud database that belongs only to them. Admin-published content is a separate shared Turso database that devices only pull from. The server is thin: it handles sign-in, creates the per-user databases and mints short-lived tokens scoped to one database, and publishes content. It never reads or writes a Believer's records itself.

## Considered Options

- Cloudflare D1: per-user databases are feasible, but there is no sync to the device; we would build our own.
- A Durable Object per user with LiveStore: event-sourced, but pre-1.0, and it would tie us to Workers.
- PowerSync or Zero over one Postgres: mature sync, but the data would be isolated row by row in one database, not one database per Believer.

## Consequences

- We use `@tursodatabase/sync-react-native` (pre-1.0). It has no Expo plugin, no Drizzle driver and no live queries, so we use Drizzle's sqlite-proxy and invalidate TanStack Query ourselves after local writes and after a `pull()` that brought changes.
- Guest databases must be opened in sync mode from the start, with a `url` function that returns null and with `bootstrapIfEmpty: false`. Opening one without a url gives a plain database with no change tracking, and its rows can never be synced.
- Each Believer gets their own database file on the device.
- If two devices edit the same record, the last push wins.
- Schema changes to synced tables must be additive only (new tables, nullable or defaulted columns), with a `schema_version` row; the app runs its bundled migrations before pushing.
- Spike before accepting this ADR: on SDK 58 for iOS and Android, rows written as a Guest must arrive in a fresh, empty cloud database after sign-in, newly created tables included. Fallback if the spike fails: plain expo-sqlite (with `useLiveQuery`), an outbox filled by triggers, and push/pull through oRPC into the Believer's Turso database. The expo-sqlite libSQL option is not a fallback: SDK 58 removed it.

## Evidence

Local, 2026-10-15 (ticket 11), against `tursodb --sync-server` 0.8.0 (npm `@tursodatabase/cli-*`, started by the tests), with the Node `@tursodatabase/sync` 0.8.3 binding (the engine the device's binding wraps) through the production spine `openUserDatabase`:

- `packages/db-user/src/shared/cloud-sync.test.ts`, all pass:
  - A Guest database (URL null, `bootstrapIfEmpty: false`) records settings; sync is paused and no token is requested. After sign-in flips the URL, one `sync()` puts the `believer_settings` table, its row and `schema_version` into a fresh, empty server database, read back on the server through `/v2/pipeline`.
  - A second device, opened as a Guest and migrated before sign-in, receives the Believer's records on its first sync (`pulledChanges: true`).
  - The same row edited on two devices ends as the last push on both devices and on the server.
- `apps/server/src/router.test.ts`, all pass: `account.ensureUserDatabase` creates one database per Believer however often (and concurrently) it is called, on the local server and through the Platform API client (`@tursodatabase/api` 2.0.5, against an in-process stand-in that answers 409 to a second create). `account.userDatabaseToken` mints tokens only for the caller's own database (60-minute, full-access).

Turso Cloud, 2026-10-16 (org `mi3lix9`, group `alrisali`, region aws-eu-west-1), with the same Node `@tursodatabase/sync` 0.8.3 binding and the production server paths (`createTursoHost` on `@tursodatabase/api` 2.0.5, the oRPC procedures, the content database): `apps/server/src/turso-cloud.live.test.ts` (`bun run --cwd apps/server test:turso-cloud`; skipped unless `TURSO_ORG`, `TURSO_API_TOKEN`, `TURSO_GROUP` are set). All 6 pass; every database it creates is destroyed afterwards and checked gone (404).

1. `account.ensureUserDatabase`, called twice concurrently and once more, plus a direct second `host.ensure` (Cloud answers 409, the host returns the existing database), gives one `b-<hash>` database in group `alrisali`, readable over `/v2/pipeline`.
2. A Guest database (URL null, `bootstrapIfEmpty: false`), migrated, with rows in `believer_settings`, `favorites` and `mood_check_ins`: paused, no token requested, the cloud database has no app table. After sign-in, one `sync()` puts every app table (the device's table list equals Cloud's), the rows and `schema_version` into the fresh, empty Cloud database. The database was created with the Platform API defaults: no `use_tursodb` (new engine) flag is needed for deferred bootstrap or push. That flag is in fact refused for this org (`tursodb is not enabled for organization`), and the creation parameters stay as they are.
3. A second device, opened as a Guest and migrated, gets `pulledChanges: true` and the Believer's settings on its first signed-in sync. The same row edited on both devices ends as the last push on both devices and on Cloud.
4. An Admin's `hijriAdjustment.set` writes the content database on Cloud over Hrana. A device replica (`openContentReplica`) pulls it with the `contentReplica` read-only token, and pulls a later change. With that token, Cloud refuses both a sync-engine push of a local change (`Operation was blocked: SQL write operations are forbidden (current session doesn't have write permission)`, code `BLOCKED`) and a direct `/v2/pipeline` write (the same message). The Admin's value is unchanged afterwards.
5. A one-minute Cloud token (the same `createToken` call the host makes): once expired, sending it again fails (`status=401 … invalid JWT token: token expired`). The async `authToken` function then fetches a new token, and the next sync pushes the change made in between.
6. `account.deleteAccount` destroys the Believer's Cloud database: the Platform API answers 404 for it, and the device's next sync fails (`status=404`, namespace does not exist).

Not yet verified:

- Android: not built or run (disk constraints).
