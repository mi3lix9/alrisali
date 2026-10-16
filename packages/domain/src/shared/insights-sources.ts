import type { Temporal } from "temporal-polyfill";

import type { HabitSchedule } from "./habit-schedule";
import type { Salah } from "./salah";

/*
 * The rows Insights are computed from. Shared because each feature that
 * records them (Prayer Log, Khushu, Habits, Tasbih, Mood) reads its own as
 * one of these, and Insights only aggregate them.
 */

/** The Salah ticked in the Prayer Log on one date. */
export interface LoggedDay {
  date: Temporal.PlainDate;
  performed: readonly Salah[];
}

/** The highest Khushu level a Salah can be rated. */
export const MAX_KHUSHU_LEVEL = 10;

/** One Salah's Khushu. Distractions are the stored keys, unchecked. */
export interface KhushuRating {
  date: Temporal.PlainDate;
  salah: Salah;
  /** 0 (distracted) to MAX_KHUSHU_LEVEL (full Khushu). */
  level: number;
  distractions: readonly string[];
  /** The Distraction the Believer typed, if any. */
  customDistraction: string | null;
}

export interface InsightsHabit {
  id: string;
  /** The Believer's own name; null for a default, named by its preset. */
  name: string | null;
  preset: string | null;
  schedule: HabitSchedule;
  archived: boolean;
  /** The local date it was created: it is not due before then. */
  createdOn: Temporal.PlainDate;
}

export interface HabitCompletionSource {
  habitId: string;
  date: Temporal.PlainDate;
}

/** Which Tasbih a Dhikr Session counted on, as the Insights name it. */
export type TasbihLabel =
  | { kind: "tasbih-al-zahra" }
  | { kind: "open"; name: string }
  /** The Open Tasbih was deleted; its sessions still count. */
  | { kind: "removed" };

export interface DhikrSessionSource {
  tasbihId: string;
  tasbih: TasbihLabel;
  count: number;
  /** The local date the session was completed. */
  date: Temporal.PlainDate;
}

export interface MoodCheckInSource {
  mood: string;
  /** The local date of the check-in. */
  date: Temporal.PlainDate;
}

/** A Khatmah as Insights read it: when it began and what was read. */
export interface KhatmahSource {
  id: string;
  startDate: Temporal.PlainDate;
  /** The day its last session was completed; null while it is unfinished. */
  completedOn: Temporal.PlainDate | null;
  /** Each completed session, in session order. */
  sessions: readonly {
    session: number;
    date: Temporal.PlainDate;
    /** The Quran Pages its portion touches. */
    pages: number;
  }[];
}

/** Everything Insights are computed from, read from the per-user database. */
export interface InsightsSources {
  prayerLogs: readonly LoggedDay[];
  khushu: readonly KhushuRating[];
  habits: readonly InsightsHabit[];
  habitCompletions: readonly HabitCompletionSource[];
  dhikrSessions: readonly DhikrSessionSource[];
  moodCheckIns: readonly MoodCheckInSource[];
  khatmahs: readonly KhatmahSource[];
}
