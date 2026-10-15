# Turso topology findings (verified 2026-10-15)

Labels: [SRC] means read in source or official docs. [INFERENCE] means my own reasoning. [UNVERIFIED] means not confirmed.

## 1. @tursodatabase/sync-react-native

- **Versions:** npm `latest` = 0.8.3, `next` = 0.9.0-pre.1 [SRC: `npm view`]. The library is still pre-1.0. Turso's sync README says: "It has not yet reached 1.0 … we recommend keeping backups" [SRC](https://github.com/tursodatabase/turso/blob/main/bindings/javascript/sync/README.md).
- **Requirements:** peer `react-native >=0.76.0`. It needs the New Architecture: the code throws "Failed to install JSI bindings. Make sure the New Architecture is enabled." [SRC index.ts](https://raw.githubusercontent.com/tursodatabase/turso/main/bindings/react-native/src/index.ts). Minimum iOS is 13.0 [SRC blog](https://turso.tech/blog/react-native-bindings-for-turso).
- **Expo config plugin:** there isn't one. The launch blog (2026-01-29) lists "Expo Plugin — Simplified setup for Expo projects" under "What's Next". `package.json` has no `app.plugin.js` and its `files` entry has no plugin. The install steps are `pod install` plus Android minSdk 21 [SRC](https://raw.githubusercontent.com/tursodatabase/turso/main/bindings/react-native/package.json). [INFERENCE] It should still work with Expo prebuild/dev-client as a plain autolinked native module, because it uses `NativeModules.Turso` with a podspec and CMake. It will not work in Expo Go. I found no stated compatibility with Expo SDK 57 or 58. The devDependency is `react-native ^0.76`. [UNVERIFIED] It has not been tested on the React Native version that ships with SDK 58.
- **API** [SRC types.ts/Database.ts]:
  - Calls: `connect(opts)` / `new Database(opts).connect()`, `exec`, `run`, `get`, `all`, `prepare`, `transaction`, `push()`, `pull()` (returns whether anything changed), `sync()`, `stats()`, `checkpoint()`, `close()`.
  - Options: `bootstrapIfEmpty` (default true), `longPollTimeoutMs`, `pushOperationsThreshold`, `pullBytesThreshold`, `clientName`, and `partialSyncExperimental` (marked EXPERIMENTAL).
  - Conflict handling is "last push wins", using logical statements [SRC docs.turso.tech/sync/usage].
- **Offline writes:** Turso documents them as "Offline-first writes" and markets them as a feature. The docs and blog never label them GA. The whole SDK is pre-1.0, so treat it as beta [INFERENCE].
- **Local-only first, attach a remote later:**
  - `DatabaseOpts.url` can be `string | (() => string | null)`. The doc comment says: "local database will be created and sync will be 'switched-on' whenever the url returns non-empty value" [SRC types.ts].
  - Caveat: `isSyncConfig` only checks that `url !== undefined`. A guest DB must therefore be opened from day one in sync mode with a url _function_ that returns null. A DB opened with no `url` at all is a plain local DB with no change capture (CDC) [SRC Database.ts].
  - [UNVERIFIED] I found no test showing that rows written before the url turned non-null get pushed into a fresh, empty cloud DB. Sync tracks changes via CDC, so [INFERENCE] those rows probably are captured. This is the highest-risk item; prototype it.
  - Fallback if it fails: on sign-in, open a new synced DB and copy the guest rows in with INSERTs.
- **Token refresh:** `authToken?: string | (() => Promise<string>)`, documented as "function which will provide short-lived credentials". It is resolved per IO request [SRC types.ts].
- **Encryption:**
  - What's documented is `remoteEncryption {cipher, key}`, for when the _cloud_ database is encrypted (ciphers aes256gcm, aes128gcm, chacha20poly1305, aegis*). It reserves 28, 32 or 48 bytes per page [SRC types.ts/Database.ts].
  - The blog advertises "Encrypt your data at rest", but the RN `DatabaseOpts` has no separate local-only encryption key option.
  - [INFERENCE] With remoteEncryption, local pages carry the reserved bytes. Whether that means the local file is encrypted is [UNVERIFIED]. If you need guaranteed encryption at rest on device, use OS file protection.

## 2. Drizzle

- `drizzle-orm/tursodatabase-sync` exists, but only in the **drizzle-orm@rc (v1.0 RC)** line. It wraps `@tursodatabase/sync`, the Node/WASM package, **not** the React Native package [SRC](https://orm.drizzle.team/docs/sqlite/connect-turso-sync). Turso's own table rates Drizzle support as "(beta)" [SRC docs.turso.tech/sdk/ts/reference].
- There is no Drizzle driver for `sync-react-native`. [INFERENCE] Use `drizzle-orm/sqlite-proxy`, with a callback that maps to `db.all`/`db.run` (the RN API mirrors better-sqlite3).
- Live queries: `useLiveQuery` exists only for expo-sqlite, because it relies on expo-sqlite change listeners. The Turso RN SDK has no change listener; "Real-time Subscriptions" is on its roadmap [SRC blog]. You would have to build reactivity yourself: invalidate after your own writes and after `pull()` returns true, e.g. with TanStack Query [INFERENCE].
- Migrations on device: Drizzle's "Web and mobile" migrator (bundled SQL) can run through the proxy [INFERENCE].

## 3. Schema migrations across per-user DBs

- Multi-DB Schemas (parent/child schema DBs) are **deprecated for all new users**. Existing paid users keep them. ATTACH is deprecated too [SRC](https://docs.turso.tech/features/multi-db-schemas).
- DDL goes through push: the docs' own push example runs `CREATE TABLE` and then `push()` [SRC sync/usage]. [INFERENCE] Pull also delivers DDL, because bootstrap and pull carry the DB state.
- Recommended pattern [INFERENCE]:
  - Only add to the schema: new tables, nullable or defaulted columns.
  - Keep a `schema_version` row.
  - The client runs the bundled migrations before push. The server can also migrate lazily on first access, or with a fan-out job over the Platform API list.
  - Never make destructive DDL changes on a table that is syncing. Last-push-wins with an older client could replay outdated statements.

## 4. Platform API

- **Create a DB:** `POST /v1/organizations/{org}/databases` with a `group`. The TS client is `@tursodatabase/api` [SRC].
- **DB token:** `POST …/databases/{db}/auth/tokens?expiration=2w&authorization=full-access|read-only`. `expiration` defaults to `never`. The body can also carry `permissions` [SRC](https://docs.turso.tech/api-reference/databases/create-token). Group tokens are also available (`groups.createToken`).
- **Fine-grained permissions:** e.g. `-p all:data_read -p comments:data_add` [SRC authorization].
- **JWKS:** `turso org jwks save <name> <url>` registers the endpoint, and `turso org jwks template` generates the claims template. But: "During the Turso Beta, we only support Clerk & Auth0 as OIDC providers." Also: "If you don't setup a JWT template … access to **all databases in all groups**" [SRC](https://docs.turso.tech/sdk/authorization/jwks).
  - So better-auth acting as its own JWKS issuer is **not documented as supported** [UNVERIFIED].
  - Recommended instead: the server mints short-lived tokens per DB through the Platform API and caches them, and the client fetches them through the `authToken` function.
- **Rate limits:** no published numbers. The docs say nothing, and apiterms.com (verified 2026-07) lists "not documented" [UNVERIFIED]. Free plan: 100 DBs, 3GB syncs/mo (third-party summary of turso.tech/pricing).

## 5. Read-only replica of a shared DB on device

- [INFERENCE] Supported: open a synced DB with a `read-only` DB/group token and call only `pull()`. Read-only tokens and pull are both documented; the combination is not shown explicitly.
- Do not write locally to that DB, because the writes would fail on push. Use `partialSyncExperimental` only if the DB is large.

## 6. Quran fonts and data

- **Size**, measured from the quranwbw/qpc-fonts tree via the GitHub API [SRC]:
  - QCF v2 TTF (`mushaf-v2`): 605 files, 208.4 MB
  - v1 woff2: 48.2 MB
  - v1 woff: 53.5 MB
  - v1 ttf: 95.4 MB
  - [INFERENCE] v2 woff2 is about 50–90 MB, but iOS and Android native font loading needs ttf/otf. So the practical options are to bundle the v1 ttf (95 MB), or to download v2 per page on demand.
- **License** [SRC QF Developer Terms, updated 2026-10-11](https://api-docs.quran.foundation/legal/developer-terms/):
  - You **may bundle** fonts and Mushaf images obtained through the QF API or CDN if you have an active Developer Console account and credit QF. They may only be distributed integrated in the app, never separately.
  - The text, translations and other QF Content **may not be prepackaged or bundled at build time**. You may cache it for at most 1 week, or keep an offline copy only through the Content Sync API, which must re-sync every 7 days when online.
  - Paid apps are OK. Required attribution: "Quran data provided by Quran.Foundation".

## 7. Ultracite and uncheck

- Ultracite supports Oxlint + Oxfmt as a first-class provider: `ultracite/oxlint/core|react|…` plus `ultracite/oxfmt`, using `npx ultracite init --linter oxlint` (v8.0.0, Oxlint 1.87) [SRC](https://www.ultracite.ai/providers/oxlint).
- `uncheck` (middleapi) runs whatever oxlint, oxfmt, tsc and sherif you installed. Its own presets are optional [SRC npm and the GitHub README].
- [INFERENCE] They coexist: use Ultracite's config files and skip uncheck's presets. Their styles conflict: uncheck's format preset uses no semicolons and single quotes, while Ultracite uses semicolons and double quotes. Pick one oxfmt config.
- uncheck is at v0.1.x, about a month old.
