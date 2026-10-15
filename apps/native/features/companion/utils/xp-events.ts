import type { XpEvent } from "@alrisali/domain/companion";

import type { EventBus } from "@/shared/lib/event-bus";
import type { AppEvents } from "@/shared/lib/events";

/**
 * Hears every devotion the Companion gains XP for and hands it on as an
 * `XpEvent`, carrying only what identifies it. Returns the unsubscribe.
 */
export const listenForXp = (
  bus: EventBus<AppEvents>,
  onXpEvent: (event: XpEvent) => void
): (() => void) => {
  const unsubscribes = [
    bus.on("SalahLogged", ({ date, salah }) =>
      onXpEvent({ kind: "salah", date, salah })
    ),
    bus.on("ActCompleted", ({ programId, actId, date }) =>
      onXpEvent({ kind: "act", programId, actId, date })
    ),
    bus.on("HabitCompleted", ({ habitId, date }) =>
      onXpEvent({ kind: "habit", habitId, date })
    ),
    bus.on("DhikrSessionCompleted", ({ sessionId }) =>
      onXpEvent({ kind: "dhikr-session", sessionId })
    ),
    bus.on("ReadingCompleted", ({ supplicationId, date }) =>
      onXpEvent({ kind: "reading", supplicationId, date })
    ),
    bus.on("LessonCompleted", ({ lessonId }) =>
      onXpEvent({ kind: "lesson", lessonId })
    ),
  ];
  return () => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  };
};
