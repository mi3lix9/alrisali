# 32: Tasbih al-Zahra and Dhikr Sessions

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Tasbih al-Zahra is always first: 34/33/33 with light haptics per tap, a stronger haptic and auto-advance per step, and an automatic Dhikr Session of 100 at the end.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings)

**Status:** ready-for-agent

- [ ] Domain tests: a full round yields exactly one Dhikr Session of 100 and resets
- [ ] Taps stay instant during sync
- [ ] Tasbih al-Zahra cannot be deleted or renamed
