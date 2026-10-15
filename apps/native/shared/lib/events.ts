import type { Salah } from "@alrisali/domain/shared";

import { createEventBus } from "./event-bus";

// Every cross-feature event, by name. A feature emits or listens to these
// through `events`; it never imports the feature on the other side. Add an
// event here when a feature needs another to react to it.
export interface AppEvents {
  /** A Believer signed in on this device. */
  SignedIn: { userId: string };
  /** The signed-in Believer signed out on this device. */
  SignedOut: undefined;
  /**
   * The Believer finished the first run on this device: their settings are
   * in place and notifications were offered, so Reminders can be planned.
   */
  OnboardingCompleted: undefined;
  /**
   * A Dhikr Session was recorded on this device. `sessionId` is stable, so a
   * listener (Companion XP) can award once per session.
   */
  DhikrSessionCompleted: {
    sessionId: string;
    tasbihId: string;
    count: number;
    completedAt: number;
  };
  /**
   * The Believer ticked a Habit for today or a past `date` (ISO
   * `YYYY-MM-DD`). `habitId` + `date` is stable, so a listener (Companion XP)
   * can award once per Habit per date; un-ticking emits nothing.
   */
  HabitCompleted: { habitId: string; date: string; completedAt: number };
  /**
   * The Believer ticked a Salah in their Prayer Log, for today or a past
   * `date` (ISO `YYYY-MM-DD`). `date` + `salah` is stable, so a listener
   * (Companion XP, the Prayer Assistant) can react once per logged Salah.
   */
  SalahLogged: { date: string; salah: Salah; loggedAt: number };
  /**
   * The Prayer Assistant followed the Believer to the end of a Salah, on
   * `date` (ISO `YYYY-MM-DD`). The Prayer Log ticks it, which then emits
   * `SalahLogged` (and with it the Khushu sheet opens).
   */
  SalahCompleted: { date: string; salah: Salah; completedAt: number };
}

export const events = createEventBus<AppEvents>();
