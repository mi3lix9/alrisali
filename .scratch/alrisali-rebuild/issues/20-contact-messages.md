# 20: Contact Messages

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** A Contact form (Guests allowed) with validation and IP-hash rate limiting; Admins read them in an inbox with unread counts and statuses.

**Blocked by:** 13 (Admin web foundation and content replica)

**Status:** done — pending simulator verification

- [x] Validation limits enforced client and server (one zod schema in `@alrisali/domain/contact`: web form, native form, oRPC input; native form look pending simulator verification)
- [x] Rate limiting tested (3 per rolling hour per HMAC'd IP; router tests incl. window expiry)
- [x] Admin inbox with statuses new/read/replied/archived (`/admin/messages`, unread badge in the admin nav)
