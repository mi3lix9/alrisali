# 33: Open Tasbih and export

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Open Tasbih counters with name, target (notify + haptic on reach) and notes; save session, reset with confirm; export Dhikr Sessions as CSV or JSON.

**Blocked by:** 32 (Tasbih al-Zahra and Dhikr Sessions)

**Status:** done — pending simulator verification

- [x] Target reached triggers feedback (domain `tapOpenTasbih` signals `target` exactly once, on the tap that reaches it; the counter plays the success haptic and shows an in-app "Target reached!" notice that is also announced to VoiceOver/TalkBack and stays while counting on past it)
- [x] Reset needs confirmation (destructive confirm alert; "Save session" records the count as a Dhikr Session, emits `DhikrSessionCompleted`, and starts again from 0)
- [x] CSV/JSON export via the share sheet ("Export" in the Tasbih header → CSV or JSON → file in the cache shared with `expo-sharing`; domain `exportDhikrSessions` with Tasbih names, ISO times, CSV quoting and formula-injection guard)
