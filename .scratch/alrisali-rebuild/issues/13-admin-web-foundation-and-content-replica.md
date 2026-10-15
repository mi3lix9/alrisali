# 13: Admin web foundation and content replica

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** The web app's /admin area with better-auth login and the Admin role; the shared content database; devices keep a pull-only replica via a read-only token. First content: the global Hijri Adjustment set in admin changes every device's Hijri Date on next sync.

**Blocked by:** 08 (Hijri calendar with Occasions), 10 (Sign in with Apple and Google)

**Status:** ready-for-agent

- [x] Non-Admins are refused on every admin procedure (server tests) — `admin` access level in `ACCESS` (`apps/server/src/router.test.ts`): every admin procedure refuses an anonymous caller (UNAUTHORIZED) and a signed-in Believer (FORBIDDEN), answers an Admin, and refuses again once the role is revoked. Role = better-auth admin plugin `role` (`admin` builder in `apps/server/src/shared/lib/orpc.ts`); grant with `bun run admin:grant <email>` in apps/server
- [ ] Admin sets global Hijri Adjustment; a device shows the change after sync, offline afterwards — web `/admin/hijri-adjustment` → `hijriAdjustment.set` writes `global_settings` in the content database; server seam (local `tursodb --sync-server`, device replica on the Node sync engine): default 0 before the first pull, the Admin's value after it, a later change only after the next sync, and the value read offline on a reopened replica with no URL. Native `useHijriCalendar` now takes the Admins' adjustment from the replica (`ADMIN_HIJRI_ADJUSTMENT` removed). Pending simulator verification (device screen); pending env: TURSO_ORG, TURSO_API_TOKEN, TURSO_GROUP (Turso Cloud run)
- [x] Device cannot write to the content replica — the replica connection has no write or push (`ReplicaConnection`: query, pull, close), its Drizzle proxy refuses every non-SELECT (`ContentReplicaReadOnlyError`, server seam), and `contentReplica` mints only read-only tokens (`authorization=read-only` on the Turso Platform API stand-in). Turso Cloud refusing a push with that token: pending env: TURSO_ORG, TURSO_API_TOKEN, TURSO_GROUP
