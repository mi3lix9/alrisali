# 03: CI and Sentry

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Every push runs uncheck (oxlint, oxfmt, tsc, sherif) and Vitest in GitHub Actions; Sentry captures errors from the native app, server and web app.

**Blocked by:** 00 (Feature folder structure and enforced boundaries)

**Status:** ready-for-agent

- [ ] GitHub Actions workflow runs check + tests on push and PR — workflow written and validated with actionlint; check/test/build pass locally with only the CI placeholder env. pending env: GitHub Actions billing (runs on push not yet observed)
- [ ] A forced error in each of native, server and web appears in Sentry — wired in all three; server (Vitest + live `GET /debug/sentry`) and web (browser `/debug/sentry`) delivered events to a local fake Sentry ingest; native iOS bundle exports with Sentry. pending env: SENTRY_DSN, VITE_SENTRY_DSN, EXPO_PUBLIC_SENTRY_DSN (and a native dev build)
- [x] macOS runner prerequisites (Metal Toolchain) documented for later native jobs (README.md › CI)
