# 37: Personal Program builder

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Believers build Personal Programs from Acts and subscribe to their own.

**Blocked by:** 36 (Acts for a date and Act Completion)

**Status:** done — pending simulator verification

- [x] Only the creator can subscribe — `assertCanSubscribe` refuses `not-creator`; the subscriptions repository allows a `personal` Subscription only when this Believer's database holds the Program (domain + db-user tests).
- [x] Personal Programs sync with the Believer database — `personal_programs` table in the per-user DB; a Program, its Subscription, an edit and a deletion reach a second device (`personal-sync.test.ts`, local sync server).
