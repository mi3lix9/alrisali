# 12: Account deletion

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Believers delete their account from Settings: after confirmation the server destroys their cloud database and auth rows, and the device is wiped.

**Blocked by:** 11 (Per-user cloud database and Guest→Believer sync)

**Status:** ready-for-agent

- [x] Cloud database and auth rows removed (server test)
- [ ] Device returns to first-run state — built (sign-out, DB wipe, every `deviceEntry` SecureStore entry deleted, `reloadAppAsync`); pending simulator verification
- [x] Signing in again starts with an empty database (server test: new user id → new, empty cloud database); live Turso deletion pending env: TURSO_ORG, TURSO_API_TOKEN, TURSO_GROUP
