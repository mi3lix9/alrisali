# 13: Admin web foundation and content replica

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** The web app's /admin area with better-auth login and the Admin role; the shared content database; devices keep a pull-only replica via a read-only token. First content: the global Hijri Adjustment set in admin changes every device's Hijri Date on next sync.

**Blocked by:** 08 (Hijri calendar with Occasions), 10 (Sign in with Apple and Google)

**Status:** ready-for-agent

- [ ] Non-Admins are refused on every admin procedure (server tests)
- [ ] Admin sets global Hijri Adjustment; a device shows the change after sync, offline afterwards
- [ ] Device cannot write to the content replica
