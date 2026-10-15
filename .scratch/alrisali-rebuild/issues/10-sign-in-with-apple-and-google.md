# 10: Sign in with Apple and Google

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** better-auth on the Hono/Bun server with the Expo plugin; Believers sign in with native Apple (iOS) and Google sheets via ID tokens, sessions kept in SecureStore; account screen shows the signed-in Believer; sign-out wipes the device database after confirmation.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** ready-for-agent

- [ ] Native Apple and Google sign-in succeed on a dev build
- [ ] Session survives relaunch
- [ ] Sign-out removes local data after confirmation
- [ ] Server oRPC tests (seam 3): anonymous vs Believer guards
