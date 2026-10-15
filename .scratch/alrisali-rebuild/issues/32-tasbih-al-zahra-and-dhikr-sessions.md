# 32: Tasbih al-Zahra and Dhikr Sessions

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Tasbih al-Zahra is always first: 34/33/33 with light haptics per tap, a stronger haptic and auto-advance per step, and an automatic Dhikr Session of 100 at the end.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings)

**Status:** done — pending simulator verification

- [x] Domain tests: a full round yields exactly one Dhikr Session of 100 and resets (`packages/domain/src/tasbih/tasbih-al-zahra.test.ts`: 100 taps → one session of 100, two step advances, back to the start; 200 taps → two)
- [ ] Taps stay instant during sync — by construction: a tap runs the pure synchronous `tapTasbihAlZahra`, updates React state and fires the haptic without awaiting anything; saving is debounced (600 ms, serialized) and flushed on background/unmount, the Dhikr Session write and `DhikrSessionCompleted` emit run after the tap, and a pull's refetch never moves a counter the Believer has tapped. Pending simulator verification (no native build: disk); iOS JS bundle exports.
- [x] Tasbih al-Zahra cannot be deleted or renamed (fixed id `tasbih-al-zahra`, always listed first; repository `rename`/`remove` throw `TasbihAlZahraIsPermanentError`, tested in `packages/db-user/src/tasbih/repository.test.ts`; the UI offers neither)
