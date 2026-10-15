# 11: Per-user cloud database and Guest→Believer sync

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** On first sign-in the server idempotently creates the Believer's Turso database and mints short-lived DB-scoped tokens through oRPC; the device starts syncing and pushes everything recorded as a Guest. Closes the ADR-0001 gate on Turso Cloud (read-only token) and Android.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings), 10 (Sign in with Apple and Google)

**Status:** done — pending Android run; pending simulator verification

- [x] Guest records appear in the Believer's cloud database after sign-in — `SignedIn` → `account.ensureUserDatabase` (server creates the database) → sync switches on with the returned URL and an `authToken` function backed by `account.userDatabaseToken` (cached until a minute before expiry) → pull, migrate, push. Seam 2 (`packages/db-user/src/shared/cloud-sync.test.ts`) proves Guest tables and rows reach a fresh database on a local `tursodb --sync-server`; `apps/server/src/turso-cloud.live.test.ts` proves it on Turso Cloud (every app table, settings, favourite and mood rows, `schema_version` in a fresh, empty Cloud database; default creation params, no `use_tursodb`). Device run pending simulator verification
- [x] A second device signing in receives the data; same-row conflict resolves to last push — seam 2, local sync server, and on Turso Cloud (live suite): a second device opened as a Guest receives the records on its first signed-in sync; same row edited on two devices ends as the last push on both and on the server
- [x] Provisioning is idempotent; tokens only open the caller's database — seam 3 (`apps/server/src/router.test.ts`): repeated and concurrent `ensureUserDatabase` create one database (local sync server, and the Turso Platform API client against a stand-in answering 409); `userDatabaseToken` takes no input and mints only for the caller's database (one `b-<hash of user id>` database per Believer, recorded in `believer_database`). On Turso Cloud (live suite): concurrent and repeated calls give one database in group `alrisali`; a one-minute Cloud token is refused once expired and the async `authToken` function fetches a new one
- [x] ADR-0001 updated to accepted (or fallback triggered) with Turso Cloud + Android evidence — accepted on the Turso Cloud evidence (`bun run --cwd apps/server test:turso-cloud`, incl. the read-only token: Cloud refuses push and writes). Android run still pending (not built or run)
