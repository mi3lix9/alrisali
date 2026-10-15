# 03: CI and Sentry

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Every push runs uncheck (oxlint, oxfmt, tsc, sherif) and Vitest in GitHub Actions; Sentry captures errors from the native app, server and web app.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] GitHub Actions workflow runs check + tests on push and PR
- [ ] A forced error in each of native, server and web appears in Sentry
- [ ] macOS runner prerequisites (Metal Toolchain) documented for later native jobs
