# 12: Account deletion

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Believers delete their account from Settings: after confirmation the server destroys their cloud database and auth rows, and the device is wiped.

**Blocked by:** 11 (Per-user cloud database and Guest→Believer sync)

**Status:** ready-for-agent

- [ ] Cloud database and auth rows removed (server test)
- [ ] Device returns to first-run state
- [ ] Signing in again starts with an empty database
