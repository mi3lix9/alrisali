---
status: proposed. The local iOS spike passed (docs/rebuild/spikes/turso-sync.md). Still pending a Turso Cloud read-only token check and Android.
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
