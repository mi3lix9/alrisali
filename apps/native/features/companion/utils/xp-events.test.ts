import type { XpEvent } from "@alrisali/domain/companion";
import { describe, expect, it } from "vitest";

import { createEventBus } from "@/shared/lib/event-bus";
import type { AppEvents } from "@/shared/lib/events";

import { listenForXp } from "./xp-events";

const AT = 1_760_590_800_000;

describe(listenForXp, () => {
  it("turns every devotion the Companion rewards into its XP event", () => {
    const bus = createEventBus<AppEvents>();
    const heard: XpEvent[] = [];
    listenForXp(bus, (event) => heard.push(event));

    bus.emit("SalahLogged", {
      date: "2026-10-16",
      salah: "fajr",
      loggedAt: AT,
    });
    bus.emit("ActCompleted", {
      programId: "muharram",
      actId: "ziyarah",
      date: "2026-10-16",
      completedAt: AT,
    });
    bus.emit("HabitCompleted", {
      habitId: "quran-page",
      date: "2026-10-16",
      completedAt: AT,
    });
    bus.emit("DhikrSessionCompleted", {
      sessionId: "session-1",
      tasbihId: "tasbih-al-zahra",
      count: 100,
      completedAt: AT,
    });
    bus.emit("ReadingCompleted", {
      supplicationId: "sahifa-1",
      date: "2026-10-16",
      completedAt: AT,
    });
    bus.emit("LessonCompleted", { lessonId: "aqeedah-1", completedAt: AT });
    bus.emit("KhatmahSessionCompleted", {
      khatmahId: "khatmah-1",
      session: 3,
      date: "2026-10-16",
      completedAt: AT,
    });

    expect(heard).toStrictEqual([
      { kind: "salah", date: "2026-10-16", salah: "fajr" },
      {
        kind: "act",
        programId: "muharram",
        actId: "ziyarah",
        date: "2026-10-16",
      },
      { kind: "habit", habitId: "quran-page", date: "2026-10-16" },
      { kind: "dhikr-session", sessionId: "session-1" },
      { kind: "reading", supplicationId: "sahifa-1", date: "2026-10-16" },
      { kind: "lesson", lessonId: "aqeedah-1" },
      { kind: "khatmah-session", khatmahId: "khatmah-1", session: 3 },
    ]);
  });

  it("ignores events that earn no XP, and stops listening when told", () => {
    const bus = createEventBus<AppEvents>();
    const heard: XpEvent[] = [];
    const stop = listenForXp(bus, (event) => heard.push(event));

    bus.emit("SignedIn", { userId: "believer" });
    stop();
    bus.emit("LessonCompleted", { lessonId: "aqeedah-1", completedAt: AT });

    expect(heard).toStrictEqual([]);
  });
});
