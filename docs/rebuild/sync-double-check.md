# Sync plan double-check (2026-10-15)

Sources: tursodatabase/turso @ main (cloned 2026-10-15, RN package.json = 0.9.0-pre.1; npm latest = 0.8.3), expo/expo @ main `packages/expo-sqlite` (CHANGELOG up to 58.0.13), npm registry, `gh issue list`.

## 1. @tursodatabase/sync-react-native: deferred url (guest → signed-in)

### Facts

- [SRC] `bindings/react-native/src/types.ts:280-287`: "You can also provide function which will return URL or null. In this case local database will be created and sync will be 'switched-on' whenever the url returns non-empty value". `url?: string | (() => string | null)`.
- [SRC] RN `Database.ts:33-34` `isSyncConfig = opts.url !== undefined && opts.url !== null`. A **function** counts as sync config, so the sync engine (with CDC) is used. Plain `url: undefined` → `initLocalDatabase()`, a plain DB with **no CDC and no sync metadata**.
- [SRC] The sync engine's main "tape" connections run `PRAGMA capture_data_changes_conn('full,turso_cdc')` (`sync/engine/src/database_tape.rs:154-179`, `database_sync_engine.rs:1227-1229` `cdc_mode: Some("full")`). So with a url **function**, local writes are CDC-tracked from the start, even while the url is null.
- [SRC] Engine `bootstrap_db` (`database_sync_engine.rs:1008-1110`): when no metadata exists:
  - `bootstrap_if_empty = true` → `bootstrap_db_file(...)` downloads the remote over HTTP. It needs a URL.
  - `false` → "Deferred bootstrap": meta has `synced_revision: None` and protocol `Unknown`, and "the first pull resolves it". This path is rejected for the legacy protocol and for partial sync.
- [SRC] **RN gotcha**: `Database.ts:170` sets `bootstrapIfEmpty: this._opts.bootstrapIfEmpty ?? true`, even when `url()` returns null. The JS (node/wasm) package instead does `bootstrapIfEmpty: typeof opts.url != "function" || opts.url() != null` (`javascript/sync/packages/native/promise.ts:96`). The RN one does not. With url → null and the default true, bootstrap issues HTTP. `ioProcessor.ts:160-162` then throws "HTTP request missing URL". [INFERENCE] Guest connect fails unless you pass **`bootstrapIfEmpty: false`** explicitly. Do this, or compute it the same way the JS package does.
- [SRC] RN resolves `url()` again on every HTTP request (`internal/ioProcessor.ts:138-148`, `getBaseUrl`). Changing what the function returns after sign-in is therefore enough. No reopen is needed for the URL itself. `authToken` can also be an async function.
- [SRC] Test `bindings/javascript/sync/packages/native/promise.test.ts:405-424` "defered sync":
  - It opens with `url: () => url` (null), creates a table and inserts rows locally.
  - `pull()` rejects with `url is empty - sync is paused`.
  - It then sets url to a remote that already has `t` with 100. After `pull()`, local = `[100,1,2,3,42]`, so local unpushed rows are rebased on top of the remote.
  - It does **not** test `push()` to a fresh _empty_ remote, and it does not check that the local `CREATE TABLE` (DDL) arrives remotely. [UNVERIFIED] DDL push to a brand-new remote. `cdc_mode "full"` captures schema changes [INFERENCE], but there is no test I found.
- [SRC] `docs` in python (`py-bindings-sync.mdx:74`): "if not set, initial bootstrap phase will be skipped and caller must call .pull(...) explicitly".

### Empty remote + existing local data

- [INFERENCE from SRC] Opened with a url fn and `bootstrapIfEmpty:false`, the DB has deferred metadata. On sign-in, call `pull()` first, which resolves the protocol and revision against the empty remote, then `push()`. Local CDC rows are not acked, so they get pushed. This is the intended "switch-on" path.
- [INFERENCE] **Risk**: suppose a guest DB was opened as plain local (`url` undefined) and is reopened later with a url. It has no metadata, so with `bootstrapIfEmpty:true` it would bootstrap the remote file into `main_db_path`. Local data could be clobbered, and in any case there is no CDC history to push. **Always open guests with a url function, never undefined.**
- [INFERENCE] One device DB = one remote. If a user signs in on a device where a different user's guest data or DB lives, use a separate file per user. Switching url to another user's DB on the same file would mix revisions.

### Issues / release

- [SRC npm] Releases are very frequent: 0.8.0 on 09-29, 0.8.1 09-29, 0.8.2 10-06, 0.8.3 10-12, 0.9.0-pre.1 10-15, with many pre-releases. Peer deps: `react-native >=0.76`, `react >=18`. Fast, still-moving pre-1.0 API.
- [SRC gh] Open issues include:
  - #4919 "Create docs for react native bindings" (RN docs are thin).
  - #8369 sync engine deadlock (holds a Mutex across await under concurrent connect/push).
  - #9796 `Statement::reset()` commits a RETURNING write without waiting for IO (10-12).
  - #9185 pullBytesThreshold only applies at bootstrap.
  - No open Expo/RN-0.8x build or crash issue was found by search. [UNVERIFIED] Expo SDK 58 (RN 0.88) builds. It needs a dev build/prebuild (JSI native module `__TursoProxy`) and will not run in Expo Go.

## 2. expo-sqlite libSQL — REMOVED in SDK 58

- [SRC] `expo-sqlite/CHANGELOG.md` 58.0.0 (2026-09-10), Breaking: "Removed libSQL support. `syncLibSQL()` and the `libSQLOptions` open option are gone, and the `useLibSQL` config plugin property is deprecated: it warns during prebuild and no longer has any effect." (#48543)
- [SRC] `plugin/src/withSQLite.ts:17-48`: `useLibSQL` is `@deprecated`, and prebuild warns "libSQL support was removed … The build always uses SQLite now."
- [SRC] History: added as "experimental" in 15.0.x (#34177). SDK 56/57 still had it but with bugs, e.g. an Android JNI crash with `useLibSQL` fixed in #46651.
- Consequences: `libSQLUrl/libSQLAuthToken/libSQLRemoteOnly` and embedded-replica `syncLibSQL()` are **not an option on SDK 58**. Offline-write behaviour and compatibility with the new Turso sync protocol are moot. [INFERENCE] libSQL embedded replicas forwarded writes to the primary, so they were never offline-write-capable.
- [SRC] expo-sqlite still has `enableChangeListener` + `addDatabaseChangeListener` (`SQLiteDatabase.ts:781-790`), which Drizzle `useLiveQuery` (`drizzle-orm/expo-sqlite`) relies on.

## 3. Fallback: plain expo-sqlite + custom sync

Minimal design:

1. Local schema: every synced table has a `id TEXT` (uuid v7) PK plus `updated_at INTEGER` (HLC or ms), `deleted_at` (tombstone) and `dirty INTEGER`. Alternatively, triggers append to a `_outbox(table,row_id,op,payload,hlc)` table. This works for guests from day 1.
2. Push: an oRPC `sync.push({ changes, clientId })` on Hono. The server resolves the user's per-user Turso DB (Platform API token stays server-side) and applies upserts with last-write-wins on `updated_at` in one batch (libsql HTTP / `@libsql/client` / `@tursodatabase/serverless`). It returns the server cursor. Clear the outbox on ack.
3. Pull: `sync.pull({ since })` returns rows with `server_seq > since`. Use a server-assigned monotonic `server_seq` column per table, or a changes table. Apply them locally in one transaction, then invalidate.
4. Guest → signed-in: on first sign-in the server creates the DB (schema migrations owned by the server) and the client pushes the whole outbox.
5. Read-only content DB: download a prebuilt `.db` file and `importDatabaseFromAssetAsync` it, or swap the file. No sync needed.
6. UI: open with `enableChangeListener: true`, then `drizzle(db)` + `useLiveQuery`. TanStack Query is not needed for local data.

- Do not put user DB tokens on the device. Going through the server avoids minting per-user tokens on the device and keeps the schema authoritative.

Complexity: moderate. Roughly 500–1000 LOC plus tests. You own the conflict policy (LWW per row), tombstones, schema versioning on both sides, batching/retry/idempotency (clientId + change id), and clock skew (prefer HLC or server seq). The big win: everything is boring, debuggable, and uses Expo-maintained SQLite.

## 4. Verdict

- **Plan A is viable but risky.** The deferred-url feature exists by design and is tested for pull-after-switch-on. Requirements:
  1. Always pass a url **function**.
  2. Pass `bootstrapIfEmpty:false` explicitly on RN (default `true` breaks guest open).
  3. Call `pull()` then `push()` on sign-in.
  4. Use one DB file per user.
  5. Use a dev build.
  - Verify with a spike: guest writes (DDL + rows) → sign-in → push to an **empty** new Turso Cloud DB → second device bootstraps. This exact path has no upstream test.
  - Pin an exact version. Releases churn weekly and there are open concurrency bugs (#8369, #9796).
- **expo-sqlite libSQL is dead** on SDK 58. Drop it from all plans.
- **Fallback order:**
  1. Plan A (pinned 0.8.3, spike first).
  2. Plain expo-sqlite + outbox + server-mediated push/pull via Hono/oRPC to per-user Turso, with Drizzle `useLiveQuery`.
  3. Same as 2 but the client writes directly via libsql HTTP or `@tursodatabase/serverless` with per-user short-lived tokens. Least preferred: tokens on device, and no server-side validation or merge.
