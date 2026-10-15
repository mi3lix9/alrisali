# 00: Feature folder structure and enforced boundaries

**What to build:** Reshape the scaffold to ADR-0005 before any feature work, so every later ticket lands in its own feature folder:

- feature folders in native, web and server
- `shared/` folders
- per-feature subpaths in the domain, api, db-user and db-content packages
- a typed event bus
- lint and dependency-graph rules that fail on boundary violations

Existing scaffold code moves into the right feature or into shared: auth goes to `account` / `admin` sign-in, the oRPC health check to shared, theme to shared.

**Blocked by:** None (can start immediately). Tickets 01, 03 and 48 are blocked by this one.

**Status:** ready-for-agent

- [ ] Native, web and server each have `features/` and `shared/{utils,ui,lib}` (server: `shared/{utils,lib}`). Route files only render feature screens.
- [ ] The domain, api, db-user and db-content packages expose one subpath per feature (for example `@alrisali/domain/prayer-times`) and a `shared` subpath where needed.
- [ ] The typed event bus lives in shared, with a type-checked event map.
- [ ] oxlint `no-restricted-imports` fails on each of these:
  - one feature importing another
  - a deep import into a feature from outside it
  - shared importing a feature
  - a feature importing another feature's domain, schema or contract
- [ ] dependency-cruiser runs in `uncheck` and CI with the same rules.
- [ ] Each rule is proven with a throwaway violation that fails, then is removed.
- [ ] The conventions are documented for contributors and agents in AGENTS.md, pointing to ADR-0005.
- [ ] `check`, `build` and the native `expo config` all pass.
