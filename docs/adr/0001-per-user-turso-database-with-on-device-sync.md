---
status: proposed. The local iOS spike passed (docs/rebuild/spikes/turso-sync.md), and so does the production code path against a local sync server (Evidence below). Still pending a Turso Cloud run (with a read-only token check) and Android.
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

Not yet verified (pending env: `TURSO_ORG`, `TURSO_API_TOKEN`, `TURSO_GROUP`):

- The same flow against a database created on Turso Cloud through the Platform API, with Cloud-minted tokens. Whether Cloud needs the database created on the new engine (`use_tursodb`, undocumented in the public API reference) for deferred bootstrap is unknown.
- A Turso Cloud read-only token: bootstrap and pull allowed, push refused.
- Android: not built or run (disk constraints).
