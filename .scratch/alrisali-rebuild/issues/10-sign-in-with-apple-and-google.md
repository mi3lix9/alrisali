# 10: Sign in with Apple and Google

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** better-auth on the Hono/Bun server with the Expo plugin; Believers sign in with native Apple (iOS) and Google sheets via ID tokens, sessions kept in SecureStore; account screen shows the signed-in Believer; sign-out wipes the device database after confirmation.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** done — pending env: GOOGLE_CLIENT_IDS, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, Apple Sign in with Apple capability; pending simulator verification (incl. sign-out device-DB wipe)

- [ ] Native Apple and Google sign-in succeed on a dev build — full path built (expo-apple-authentication / google-signin sheets → `signIn.social({ idToken })` → better-auth Apple/Google ID-token verification); server path tested with a fake ID-token verifier; iOS JS bundle exports and the prebuild config carries the Apple entitlement and Google URL scheme. pending env: GOOGLE_CLIENT_IDS, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (+ Apple capability) and a dev build
- [ ] Session survives relaunch — session cookie and session cache live in SecureStore (`expoClient`), restored on launch before any network call. pending simulator verification
- [x] Sign-out removes local data after confirmation — confirmation dialog, then the SecureStore session and Google account are cleared (works offline) and `SignedOut` is emitted; the device database (ticket 02, `apps/native/shared/lib/user-database.ts`) subscribes to `SignedOut`, wipes itself and resets user-data queries so the next read opens a fresh Guest database. Code complete; device run pending simulator verification
- [x] Server oRPC tests (seam 3): anonymous vs Believer guards — `apps/server/src/router.test.ts`: every procedure needs an access rule; anonymous vs Google/Apple Believer, forged token refused, signed-out session refused
