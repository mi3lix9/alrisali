# 00: Feature folder structure and enforced boundaries

**What to build:** Reshape the scaffold to ADR-0005 before any feature work, so every later ticket lands in its own feature folder:

- feature folders in native, web and server
- `shared/` folders
- per-feature subpaths in the domain, api, db-user and db-content packages
- a typed event bus
- lint and dependency-graph rules that fail on boundary violations

Existing scaffold code moves into the right feature or into shared: auth goes to `account` / `admin` sign-in, the oRPC health check to shared, theme to shared.

**Blocked by:** None (can start immediately). Tickets 01, 03 and 48 are blocked by this one.

**Status:** done

- [x] Native, web and server each have `features/` and `shared/{utils,ui,lib}` (server: `shared/{utils,lib}`). Route files only render feature screens.
  - Native `features/account`; web `features/{admin,landing}`; server `features/account`. Empty `shared/utils/` in web and server hold a `.gitkeep`. The demo tab, modal and not-found screens stay as JSX-only routes until ticket 01 replaces them.
- [x] The domain, api, db-user and db-content packages expose one subpath per feature (for example `@alrisali/domain/prayer-times`) and a `shared` subpath where needed.
  - Each package exports `"./*": "./src/*/index.ts"`. `api` is contract-first (`@orpc/contract`) with `@alrisali/api/account` and `@alrisali/api/shared` (health check); its root aggregates the contract for the server and the oRPC clients. domain, db-user and db-content get their first `src/<feature>/` folders with their tickets.
- [x] The typed event bus lives in shared, with a type-checked event map.
  - `apps/native/shared/lib/event-bus.ts` (tested) and the `AppEvents` map in `shared/lib/events.ts`; account emits `SignedIn`/`SignedOut`, the shared query client reacts.
- [x] oxlint `no-restricted-imports` fails on each of these:
  - one feature importing another
  - a deep import into a feature from outside it
  - shared importing a feature
  - a feature importing another feature's domain, schema or contract
- [x] dependency-cruiser runs in `uncheck` and CI with the same rules.
  - uncheck cannot host extra tools, so `bun run check` is `uncheck && bun run check:boundaries`; CI and pre-push run `bun run check`.
- [x] Each rule is proven with a throwaway violation that fails, then is removed.
- [x] The conventions are documented for contributors and agents in AGENTS.md, pointing to ADR-0005.
- [x] `check`, `build` and the native `expo config` all pass.
