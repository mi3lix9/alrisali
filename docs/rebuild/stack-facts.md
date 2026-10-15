# Stack facts for the Expo/RN rebuild (checked 2026-10-15)

Legend: **[SRC]** = read directly at the linked source. **[INFERENCE]** = my own reading, not stated by the source. **[UNVERIFIED]** = not confirmed.

## 0. Expo SDK baseline

- SDK 58 **beta** came out 2026-09-15 with RN 0.88 RC and iOS 27 support [SRC https://expo.dev/changelog/sdk-58-beta]. A staging page announces the stable release [https://staging.expo.dev/changelog/sdk-58], but public docs still list "SDK 57 (latest)" [https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/bottomsheet]. **Uncertain:** SDK 58 is either just released or about to be. Plan for 57 or 58.

## 1. PanelUI (panelui.dev)

- **What it is:** an open-source (MIT) React Native component library for Expo. The npm package is `panelui-native`. Docs say "139 typed component modules". The repo has 814★, 34 forks and 2 open issues. [SRC https://panelui.dev/docs, https://github.com/panel-ui/PanelUI]
- **Requirements:** **Expo SDK 57+**, RN 0.86 and Node 20+. It has no native modules, so it runs in Expo Go with no prebuild. [SRC https://panelui.dev/docs/installation]
- **Styling:** it **requires Uniwind (≥1.0) plus Tailwind CSS v4**. It does _not_ use NativeWind. Setup needs:
  - `withUniwindConfig` in `metro.config.js`
  - a `global.css` with `@import 'tailwindcss'; @import 'uniwind'; @import 'panelui-native/theme.css'; @source …`
  - `<PanelUIProvider>` at the root

  Required peers: reanimated (4 is used), worklets, gesture-handler, safe-area-context, react-native-svg, masked-view, expo-linear-gradient. Optional: expo-haptics, expo-blur, `@expo/ui` (native controls behind Button/Switch/Slider/Select/BottomSheet), keyboard-controller, maplibre. [SRC installation page]

- **Components:** Card, Form/Field/Input, Select/Combobox, Date/TimePicker, Calendar, Tabs, Dialog, BottomSheet, Drawer, Toast, Tooltip, many charts, Map, QRCode, AI chat components, Timeline, Countdown and more. There is also `panelui-cli` to copy component source into your project (shadcn-style), and `create-panelui-app`. A separate `panelui-web` package exists. [SRC README]
- **Maturity [INFERENCE]:** young and moving fast. The component count differs between pages (76 / 111 / 125 / 136 / 138 / 139), and it has a single primary org.
- **RTL: no documentation found.** The installation page has no "RTL"/"I18nManager" mentions, and a web search found nothing. **This is a risk for an Arabic-first app.** Test it with `I18nManager.forceRTL` before committing. Uniwind/Tailwind logical classes (`ms-`/`me-`/`start-`) may help [UNVERIFIED for PanelUI internals].

## 2. Expo UI (@expo/ui) and native shells

- **Status:** stable as of **SDK 56** (2026-05-26). It wraps real SwiftUI on iOS and Jetpack Compose on Android. [SRC https://expo.dev/blog/expo-ui-stable-sdk-56]
  - It ships in the default `create-expo-app` template and in Expo Go.
  - Imports: the universal layer `@expo/ui` (Host, Row, Column, ScrollView, FieldGroup, Switch, Slider, Text, Button, Spacer…), plus `@expo/ui/swift-ui` and `@expo/ui/jetpack-compose`.
  - The universal layer is a "first iteration" and web support is experimental.
  - Inside `<Host>`, layout uses SwiftUI/Compose stacks, not Yoga.
  - You can extend it with your own SwiftUI/Compose views.
  - Android extras: Material 3 dynamic colours and Material Symbols.
- **Drop-in replacements** (`@expo/ui/community/*`): datetime-picker, slider, pager-view, picker, segmented-control, masked-view, menu, **bottom-sheet (@gorhom-compatible)**. [SRC same blog]
- **Sheets:** a universal BottomSheet plus SwiftUI and drop-in variants are documented for SDK 58. [SRC https://docs.expo.dev/versions/v58.0.0/sdk/ui/universal/bottomsheet]
- **Native tabs (expo-router):** the import is `expo-router/native-tabs` from **SDK 58**. In SDK 54–57 it was `expo-router/unstable-native-tabs`. [SRC https://docs.expo.dev/router/advanced/native-tabs/]
  - It uses the system tab bar, including Liquid Glass on iOS 26+.
  - API: `NativeTabs.Trigger` / `.Label` / `.Icon sf= md=` / badge.
  - Tabs must be declared explicitly.
  - Distinct selected icons on Android need SDK 56+.
- **Stack/modals:** expo-router Stack (native-stack) and modals are documented in the same section [SRC nav list on that page]. **Navigation is not part of @expo/ui; it comes from expo-router.**

## 3. middleapi/uncheck

- **It is a CLI dev tool**, not a runtime library, type-safety library or error-handling library. It is "one command to lint, format check and type check". It runs the **oxlint, oxfmt, tsc and sherif** you have installed. [SRC https://github.com/middleapi/uncheck]
- Commands: `npx uncheck init`, `npx uncheck`, `npx uncheck --fix`.
- `init` can also:
  - install oxlint/oxfmt/sherif
  - write preset configs
  - add a pre-commit hook (`uncheck prepare --pre-commit` runs `uncheck staged --fix`, replacing lint-staged)
  - add coding-agent end-of-turn hooks (e.g. `.claude/settings.json`)
- Flags: `--only`, `--skip`, `--require`, `--cwd`, file/glob args. Requires Node ≥22.20. MIT, 38★. It comes from the oRPC authors (middleapi). [SRC README]

## 4. Better-T-Stack CLI (create-better-t-stack, npm v3.36.3)

All options below come from [SRC https://www.better-t-stack.dev/docs/cli/options].

| Area | Flag | Values |
| --- | --- | --- |
| Native frontends | `--frontend` | `native-bare`, `native-uniwind`, `native-unistyles`. **Not NativeWind.** Can be combined with a web frontend, and there is a `--template uniwind`. |
| Web frontends | `--frontend` | tanstack-router, react-router, tanstack-start, next, nuxt, svelte, solid, astro, none |
| Backend | `--backend` | none, hono, express, fastify, elysia, convex, self |
| Runtime | `--runtime` | bun, node, workers, none (none only with convex/none/self) |
| API | `--api` | trpc, orpc, none |
| Database | `--database` | none, sqlite, postgres, mysql, mongodb |
| ORM | `--orm` | drizzle, prisma, mongoose, none |
| DB setup | `--db-setup` | turso, d1 (needs Workers server deploy or self+CF web), neon, supabase, prisma-postgres, planetscale, mongodb-atlas, docker, none |
| Auth | `--auth` | better-auth (default; needs a backend), clerk, none |
| Payments | `--payments` | polar (requires better-auth) |
| Addons | `--addons` | pwa, tauri, electrobun, starlight, fumadocs, biome, lefthook, husky, **turborepo**, nx, vite-plus, ultracite, **oxlint** (oxlint+oxfmt), mcp, opentui, wxt, skills, evlog, axiom |
| Deploy | `--web-deploy` / `--server-deploy` | cloudflare (Workers via Alchemy IaC), prisma, docker, vercel |
| Package manager | `--package-manager` | npm, pnpm, bun |
| Other |  | `--examples todo ai`, `--dry-run`, `create-json`/programmatic API |

- Layout: apps/packages workspaces, with infra in `packages/infra` (Alchemy) [SRC options page mentions `packages/infra`]. The exact folder names (`apps/native`, `apps/server`, `packages/db`/`api`/`auth`) are [UNVERIFIED]; check them with `--dry-run`.
- Expo with better-auth on the Convex backend is supported [SRC note].

## 5. better-auth + Expo (@better-auth/expo)

All points from [SRC https://better-auth.com/docs/integrations/expo.md].

- Docs target Expo SDK 55 and the New Architecture.
- Server: add `plugins: [expo()]` and `trustedOrigins: ["myapp://", …]`. Dev `exp://` patterns are documented.
- Client: `createAuthClient` from `better-auth/react` with `expoClient({ scheme, storagePrefix, storage: SecureStore })`. Also needs `expo-network`.
  - Session data and cookies are cached in **expo-secure-store**. `disableCache` turns that off, and `cookiePrefix` is configurable.
  - For your own API calls, read the cookie from SecureStore and send it in headers. Tip: `authClient.getCookie()` [INFERENCE from the "Making authenticated requests" section].
- **Native ID-token sign-in:** `authClient.signIn.social({ provider, idToken: { token, nonce? } })`. Docs: "only google, apple and facebook are supported for idToken signIn".
  - Google: documented example with `@react-native-google-signin/google-signin`; pass `response.data.idToken`.
  - Apple: same `idToken` path, e.g. with `expo-apple-authentication` [INFERENCE]. The Apple provider page covers clientId, Team ID, Key ID and the private-key JWT [https://better-auth.com/docs/authentication/apple]. For native iOS, the token audience is the app bundle ID. Check `appBundleIdentifier` in the Apple docs [UNVERIFIED].
- **Workers + D1 vs Turso:** Better-T-Stack generates better-auth with Drizzle on Workers using either `--db-setup d1` or `turso` [SRC options]. I did not read a D1-specific better-auth doc [UNVERIFIED]. Either works through the Drizzle adapter (sqlite dialect) [INFERENCE].

## 6. Per-user DB and offline sync

| Option | RN offline-first? | Per-user isolation | Notes / source |
| --- | --- | --- | --- |
| **Turso + `@tursodatabase/sync-react-native`** | **Yes.** Local embedded DB with `push()`/`pull()`, and offline writes work. | **Yes**, one cloud DB per user. | Released 2026-01-29. Needs RN 0.76+ New Arch; JSI native module, so no Expo Go (Expo plugin "coming"); `connect({path,url,authToken})`. [SRC https://turso.tech/blog/react-native-bindings-for-turso] Conflicts: **last push wins**; on pull, unpushed local changes are rolled back and replayed. [SRC https://docs.turso.tech/sync/conflict-resolution] Planned but not yet shipped: partial sync and real-time subscriptions. Offline writes were labelled "beta" earlier [https://turso.tech/local-first]. |
| Turso pricing |  |  | Free: 100 DBs, 5GB, 3GB syncs. Developer $5.99/mo ($4.99/mo yearly): **unlimited DBs**, 9GB, 10GB syncs. Overages are off by default, and DBs are blocked at the quota. [SRC https://turso.tech/pricing] |
| op-sqlite / libsql | Possible alternative client |  | Not verified this session [UNVERIFIED]. |
| **Cloudflare D1** | **No** native client sync; it is server-side only. | Feasible: CF itself says D1 is designed for "per-user, per-tenant" DBs. | 50,000 DBs/account on Workers Paid (more on request, "millions"); 10 on Free. 10GB per DB, single-threaded. ~5,000 bindings per Worker script, so per-user DBs need runtime routing (REST/API, not static bindings) [INFERENCE]. [SRC https://developers.cloudflare.com/d1/platform/limits/] You would build your own sync with expo-sqlite. |
| **Durable Object (SQLite) per user** | Server side only; you build the client sync. | **Natural fit**: one DO per userId. | 10GB per DO on Paid, no account storage cap. [SRC DO limits FAQ https://developers.cloudflare.com/durable-objects/platform/limits/] |
| **LiveStore** (0.4.0) | **Yes.** Expo adapter, event-sourced, client SQLite. | Per-store sync via a Cloudflare DO sync backend (store per user). | [SRC https://docs.livestore.dev/getting-started/expo, https://docs.livestore.dev/platform-adapters/cloudflare-durable-object-adapter]. Pre-1.0. |
| **PowerSync** | **Yes.** RN & Expo SDK (`@powersync/react-native` 1.28, `@powersync/op-sqlite`). | Row-level per-user via Sync Streams (SQL-defined subsets), all in one shared backend DB. | Needs Postgres/MongoDB/MySQL/SQL Server plus the PowerSync service (cloud or self-host). [SRC https://docs.powersync.com/client-sdks/reference/react-native-and-expo, https://docs.powersync.com/sync/streams/overview] |
| **Zero (Rocicorp)** | RN/Expo supported (kvStore: expo-sqlite / op-sqlite). | Per-user through synced queries/permissions on Postgres. | Needs Postgres plus zero-cache. Offline _writes_ are limited [UNVERIFIED]. [SRC https://zero.rocicorp.dev/docs/react-native] |
| **ElectricSQL** | Read-path sync (shapes). Writes are your own API, or TanStack DB with `@tanstack/offline-transactions` (has an RN executor). | Shapes filtered per user. | [SRC https://electric-sql.com/docs/guides/writes, https://tanstack.com/db/latest/docs/guides/offline-transactions] |
| **TinyBase** | Yes, local-first store with persisters (expo-sqlite, PowerSync, etc.) and sync (WebSocket, can run on a DO). | Your design. | [SRC https://tinybase.org/] Persister list partly seen; DO sync details [UNVERIFIED]. |
| **Replicache** | Not checked this session. |  | Rocicorp's focus has moved to Zero [UNVERIFIED]. |
| **expo-sqlite + custom sync** | Yes, but you build it. | Any backend. |  |

### Which options do RN offline-first _with_ per-user isolation

- **Physical isolation (one DB per user), turnkey:** Turso (sync-react-native) and LiveStore (+CF DO).
- **Logical row-level isolation, turnkey:** PowerSync and Zero (one central Postgres).
- **D1 or a Durable Object per user:** isolation is easy, but you must write the client sync yourself.
- **Recommendation [INFERENCE]:** for a guest-first app (local DB, then sync once signed in), Turso per-user DB or PowerSync fit best. Turso's conflict model is coarse (last push wins). That is fine for single-user data such as tasbih counts and bookmarks.
