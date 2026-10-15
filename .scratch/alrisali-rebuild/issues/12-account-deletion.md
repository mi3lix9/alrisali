# 12: Account deletion

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Believers delete their account from Settings: after confirmation the server destroys their cloud database and auth rows, and the device is wiped.

**Blocked by:** 11 (Per-user cloud database and Guest→Believer sync)

**Status:** done — pending simulator verification

- [x] Cloud database and auth rows removed (server test; on Turso Cloud, `apps/server/src/turso-cloud.live.test.ts`: after `account.deleteAccount` the Platform API answers 404 for the Believer's database and the device's next sync fails with 404)
- [ ] Device returns to first-run state — built (sign-out, DB wipe, every `deviceEntry` SecureStore entry deleted, `reloadAppAsync`); pending simulator verification
- [x] Signing in again starts with an empty database (server test: new user id → new, empty cloud database); live Turso deletion verified (live suite, 2026-10-16)
