# Spike 1: Turso sync on Expo SDK 58 (ADR-0001 gate)

**Verdict: PARTIAL.**

- iOS: all 6 cases PASS against a local Turso sync server. This only works with a native patch to `@tursodatabase/sync-react-native` 0.8.3. Unpatched, it does not compile on RN 0.88.
- Android: not verified (skipped by user decision; disk constraints).
- Read-only token enforcement and Turso Cloud behaviour: not verifiable locally. They need Turso Cloud.

## Versions (exact, installed)

| package | version |
| --- | --- |
| expo | 58.0.10 (`next` tag; `latest` is still 57.0.29) |
| react-native | 0.88.0-rc.4 (what the SDK 58 template pins) |
| react | 19.3.0 |
| expo-dev-client | 58.0.13 |
| expo-build-properties | 58.0.10 |
| @tursodatabase/sync-react-native | 0.8.3 (npm `latest`; `next` = 0.9.0-pre.1) |
| @tursodatabase/sync (Node, host pre-check only) | 0.8.3 |
| drizzle-orm / drizzle-kit | 0.45.4 / 0.31.11 |
| local sync server | `tursodb` 0.8.0, from npm `@tursodatabase/cli-darwin-arm64@0.8.0` (newest non-pre CLI binary) |

Bundle id: `com.alrisali.app.dev.spike1`. New Architecture is always on in SDK 58. Simulator: iOS "iPhone 18 Pro" (5050FEC8-…).

## Local sync server: which one works

- **Works:** `tursodb --sync-server 0.0.0.0:8090 --sync-dir server/dbs`. This is the `--sync-server` mode of the new Turso (Rust) CLI, and its source is `cli/sync_server.rs` in tursodatabase/turso.
  - Each `http://host:8090/db/<name>` is created on first request as `server/dbs/<name>/data`.
  - It speaks the protocol `sync-react-native` uses: `/v2/pipeline` for push, and `/pull-updates` for bootstrap and pull.
- Not used:
  - `turso dev` / `sqld` (Homebrew `sqld`, Turso CLI v1.0.7) is the legacy libSQL server. The new engine rejects the legacy protocol for deferred bootstrap, per the source notes in `docs/rebuild/sync-double-check.md`.
  - The npm `turso` wrapper package stops at 0.7.0-pre.13, so I used the platform binary package directly.
- Local-server quirks I observed:
  1. **No authentication at all.** `grep` for `auth`/`Authorization` in `cli/sync_server.rs` finds nothing, and the README says "no authentication … meant for local development". Tokens are sent but ignored.
  2. **It only serves WAL frames.** The server disables auto-checkpoint, and page pulls scan WAL frames `client_revision+1..max_frame`.
     - I seeded a DB offline with the `tursodb` CLI (`content_v1`). After the CLI exited, a fresh client bootstrapped an empty DB with `no such table: duas`.
     - Seeding through the server's `/v2/pipeline` (`server/seed-content.sh`, DB `content_v3`) works.
     - So local fixtures must be written through the server.

## Commands run

```sh
# server
npm pack @tursodatabase/cli-darwin-arm64@0.8.0 && tar xzf … -C server   # -> server/package/tursodb
mkdir -p server/dbs && server/package/tursodb --sync-server 0.0.0.0:8090 --sync-dir server/dbs
server/seed-content.sh content_v3                         # server-side seed of the content DB via HTTP
node server/host-check.mjs                                # host pre-check with Node @tursodatabase/sync 0.8.3
# app
bunx create-expo-app@latest --template blank-typescript@sdk-58
bun add @tursodatabase/sync-react-native@0.8.3 drizzle-orm@0.45.4; bun add -d drizzle-kit@0.31.11 @tursodatabase/sync@0.8.3
bunx expo install expo-dev-client expo-build-properties
bunx drizzle-kit generate --name init && node scripts/bundle-migrations.mjs   # drizzle SQL -> src/migrations.generated.ts
CI=1 bunx expo prebuild --clean
CI=1 bunx expo start --dev-client --port 8095
CI=1 bunx expo run:ios --no-bundler --device 5050FEC8-1E1F-4E36-855D-76532C790268
xcrun simctl openurl <udid> "exp+turso-sync-spike://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8095"
server/package/tursodb --readonly server/dbs/<db>/data "select * from notes; …"   # server-side CLI verification
```

The test runner is `src/runner.ts`, rendered by `App.tsx`. It runs once on launch and logs `[SPIKE] CASEn PASS|FAIL …` to Metro and to the screen.

## Blocker found and patched: native module does not build on RN 0.88

- **Unpatched build fails.** `ios/TursoModule.mm` casts the bridge to `RCTCxxBridge` and reads `.runtime`. RN 0.88 no longer declares `RCTCxxBridge`, so the build fails with 8 errors (`unknown type name 'RCTCxxBridge'`, `property 'runtime' not found on object of type 'RCTBridge *'`).
  - Evidence: first build attempt, `.expo/xcodebuild.log`, summarised here.
  - 0.9.0-pre.1 has identical code (checked from its npm tarball).
- **The patch.** It is in `patches/@tursodatabase%2Fsync-react-native@0.8.3.patch` and is applied by `bun` via `patchedDependencies`.
  - In bridgeless mode `self.bridge` is an `RCTBridgeProxy`, which still implements `-(void *)runtime`. The patch messages it directly and installs only from the synchronous `install()` method, which runs on the JS thread.
  - A first attempt that guarded with `respondsToSelector:` silently failed. `RCTBridgeProxy` is an `NSProxy`, so the result was `ReferenceError: Property '__TursoProxy' doesn't exist`; see `evidence/ios-state.png`.
  - **Production needs this patch (or an upstream fix / Expo module wrapper) for SDK 58.**
- **Android (static read only, not run).**
  - `TursoBridge.java` uses `context.getCatalystInstance().getJSCallInvokerHolder()`.
  - In RN 0.88, `BridgelessReactContext.getCatalystInstance()` only logs a warning, unless `UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE` is set, in which case it throws. So it probably works, but this is [UNVERIFIED].
  - The Gradle build got as far as `:tursodatabase_sync-react-native:compileDebugJavaWithJavac` before I cancelled it on user instruction (`evidence/android-build.log`).

## Results per case

| # | Case | iOS (iPhone 18 Pro) | Android (Pixel_9_Pro_API_36) |
| --- | --- | --- | --- |
| 1 | Guest: `url: () => null`, `bootstrapIfEmpty:false`, drizzle migration SQL via sqlite-proxy, inserts, pull while url null | **PASS** | not verified (skipped by user decision; disk constraints) |
| 2 | Sign-in: url flipped to a fresh empty server DB, `pull()` then `push()`, table + rows on the server | **PASS** | not verified (skipped by user decision; disk constraints) |
| 3 | Second device: bootstrap, write/push, pull on A, same-row conflict resolved by last push | **PASS** | not verified (skipped by user decision; disk constraints) |
| 4 | Content DB seeded server-side, opened with a "read-only" token, pull + read | **PASS** (read path only; token not enforced locally) | not verified (skipped by user decision; disk constraints) |
| 5 | `authToken` as async function is called | **PASS** | not verified (skipped by user decision; disk constraints) |
| 6 | Drizzle sqlite-proxy typed select/insert on the Turso RN connection | **PASS** | not verified (skipped by user decision; disk constraints) |

### Evidence

- `evidence/ios-metro-final.log`: final full run, all 6 PASS (runId `ios_1792074727556`). Copied verbatim from the Metro service output.
- `evidence/ios-final.png` / `evidence/ios-run1.png`: on-screen runner.
- `evidence/ios-server-cli-final.txt`: `tursodb --readonly` on `server/dbs/user_ios_1792074727556/data`.
  - It shows table `notes` (plus the engine's `turso_sync_last_change_id`) and rows `n1=from-b (11)`, `n2=guest-2`, `n3=from-device-b`.
  - This is the end state after cases 2 and 3.
  - The state right after case 2 (only `n1`,`n2`) was checked server-side by the app over the server's `/v2/pipeline`: `serverRows=[["n1","guest-1","1"],["n2","guest-2","2"]]`.
- `evidence/ios-metro-run1.log` + `evidence/ios-server-cli-run1.txt`: the first run. CASE1 was marked FAIL there only because my assertion expected the Node SDK's error text. All other cases passed. Some of the repeated `authToken()` lines in that file are condensed.
- `evidence/host-check.log` + `evidence/host-check-server-cli.txt`: the same flow with the Node SDK 0.8.3 on the host. This is the protocol pre-check.

### Observations per case

1. **Guest DB.**
   - Guest rows were written and read back through drizzle.
   - `pull()` with url null **rejects cleanly**, with no crash, and the DB stays usable (2 rows readable afterwards).
   - On RN the message is `HTTP request missing URL: no URL in request and no baseUrl in context`, from the JS IO loop. The Node SDK says `url is empty - sync is paused`. App code should treat both as "sync paused".
   - `bootstrapIfEmpty:false` was passed explicitly, as required.
2. **Sign-in.** After the url function was flipped to an empty DB, `pull()` returned `false` and `push()` succeeded. On the server, `notes` exists with the guest-time `CREATE TABLE` and both rows. **So DDL plus rows written while url was null reach a brand-new empty remote.** This was the main unknown in the gate, and it holds against the local server.
3. **Second device.**
   - Device B, on a second local file, bootstrapped 2 rows.
   - B's insert `n3` was pushed and A's `pull()` returned `true` with `n3`.
   - Conflict: A set `n1` to `from-a` and B set `n1` to `from-b`, both before syncing. A pushed first and B pushed last.
   - Final result: `from-b` on A, on B and on the server. That is last-push-wins, as documented.
4. **Content DB.**
   - Bootstrapped from `content_v3` (seeded server-side) and read 3 Arabic rows through drizzle, with UTF-8 intact.
   - The "read-only token" is meaningless locally, because the server has no auth.
   - **Not verified:** that a Turso Cloud read-only token allows bootstrap/pull and rejects push.
5. **Async `authToken`.** The function was invoked on each sync HTTP request: A 7 calls, B 6, content 2.
6. **Drizzle typed queries.**
   - `drizzle-orm/sqlite-proxy` with a ~10-line callback (`db.run` / `db.all` → `Object.values` rows) works on the Turso RN connection for insert, select, `.get()`, update and delete.
   - Column mapping works (`updated_at` → `updatedAt: number`).
   - The drizzle-kit migration SQL was executed through the same proxy (`sql.raw`).
   - Caveat: `Object.values` collapses duplicate column names in joins. A production proxy should use a raw/array row mode if the binding adds one; it has none in 0.8.3.

## What could not be verified, and why

- **Android, all cases:** user decision to stop Android work (disk full). Not built, not run.
- **Turso Cloud** (no credentials; `turso` CLI not logged in):
  - read-only token enforcement;
  - Platform-API-created empty DBs behaving like the local `--sync-dir` DBs;
  - real auth/JWT handling of the `authToken` function;
  - Cloud-side checkpointing. The local server only serves WAL frames; Cloud's page server differs.
- **Unpatched package on SDK 58:** it fails to compile on iOS, as observed.
- **Long-poll, partial sync, encryption, concurrency issues #8369 / #9796:** not exercised.

## ADR-0001 spike gate

**It needs Turso Cloud to conclude.** Locally, on iOS, the gate's core behaviour passes:

- a Guest DB opened with a null url and `bootstrapIfEmpty:false` pushes its newly created table and rows into a fresh, empty database after sign-in;
- a second device bootstraps;
- a pull-only content replica works.

Conditions attached to that result:

1. `@tursodatabase/sync-react-native` 0.8.3 (and 0.9.0-pre.1) **does not build on SDK 58 / RN 0.88 without the included iOS patch**. Ship the patch, or get an upstream fix, before adopting.
2. Android is unverified.
3. The read-only-token half of the gate needs a Turso Cloud run.

To close the gate, repeat cases 2 and 4 against a Cloud DB created through the Platform API, with a `read-only` token, and run the app once on Android.

## Cleanup done

- Stopped the sync server, Metro and the emulator.
- Deleted the iOS DerivedData (`TursoSyncSpike-*`), `ios/Pods`, `android/app/build`, `android/.gradle` and the `node_modules/*/android/build` dirs.
- To rebuild iOS: `cd ios && pod install`, then `expo run:ios`.
- `server/dbs/` keeps the server DBs used as evidence.
