# 11: Per-user cloud database and Guest→Believer sync

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** On first sign-in the server idempotently creates the Believer's Turso database and mints short-lived DB-scoped tokens through oRPC; the device starts syncing and pushes everything recorded as a Guest. Closes the ADR-0001 gate on Turso Cloud (read-only token) and Android.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings), 10 (Sign in with Apple and Google)

**Status:** ready-for-agent

- [ ] Guest records appear in the Believer's cloud database after sign-in
- [ ] A second device signing in receives the data; same-row conflict resolves to last push
- [ ] Provisioning is idempotent; tokens only open the caller's database
- [ ] ADR-0001 updated to accepted (or fallback triggered) with Turso Cloud + Android evidence
