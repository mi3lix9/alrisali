# 44: Prayer Assistant core and tap mode

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Prayer Assistant flow: choose Salah, Pace and sensitivity; the domain rak'ah state machine drives Positions and Rak'ahs with tap-to-advance; final tashahhud hold; then log the Salah and rate Khushu.

**Blocked by:** 06 (Khushu rating)

**Status:** done — pending simulator verification

- [x] Domain tests: rak'ah counts, middle tashahhud, hold timings per Pace, final hold
- [x] Completion logs Salah and opens Khushu
- [x] Screen stays awake
