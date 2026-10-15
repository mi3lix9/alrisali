import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import type { Salah } from "../shared";

/**
 * The Distractions a Believer can pick, in the order they are listed. Carried
 * over from the old app; anything else is typed as a custom Distraction.
 */
export const DISTRACTIONS = [
  "mindWandering",
  "phoneNotifications",
  "childrenNoise",
  "workRelated",
  "fatigue",
  "laziness",
  "environmental",
] as const;

export type Distraction = (typeof DISTRACTIONS)[number];

export const distractionSchema = z.enum(DISTRACTIONS);

export const MIN_KHUSHU_LEVEL = 0;
export const MAX_KHUSHU_LEVEL = 10;
/** Where the slider starts for a Salah not rated yet. */
export const DEFAULT_KHUSHU_LEVEL = 7;
export const MAX_CUSTOM_DISTRACTION_LENGTH = 100;

/** The Believer's Khushu for one Salah on one date. */
export interface Khushu {
  date: Temporal.PlainDate;
  salah: Salah;
  /** A whole number from 0 (distracted) to 10 (full Khushu). */
  level: number;
  /** In the list's order, each at most once. */
  distractions: readonly Distraction[];
  /** A Distraction the Believer typed, or null. */
  customDistraction: string | null;
}

/** Why a Khushu rating was refused. */
export type InvalidKhushuReason = "futureDate" | "level" | "customDistraction";

export class InvalidKhushuError extends Error {
  readonly reason: InvalidKhushuReason;

  constructor(reason: InvalidKhushuReason, message: string) {
    super(`Invalid Khushu: ${message}`);
    this.name = "InvalidKhushuError";
    this.reason = reason;
  }
}

/**
 * A Khushu rating as it is kept: the level checked, Distractions listed once
 * in order, a typed Distraction trimmed (blank is none). Throws
 * `InvalidKhushuError` for a date after `today`, a level off the 0–10 scale
 * or a typed Distraction that is too long.
 */
export const rateKhushu = (
  rating: Khushu,
  today: Temporal.PlainDate
): Khushu => {
  if (Temporal.PlainDate.compare(rating.date, today) > 0) {
    throw new InvalidKhushuError(
      "futureDate",
      `a future date (${rating.date.toString()}) cannot be rated`
    );
  }
  if (
    !Number.isInteger(rating.level) ||
    rating.level < MIN_KHUSHU_LEVEL ||
    rating.level > MAX_KHUSHU_LEVEL
  ) {
    throw new InvalidKhushuError(
      "level",
      `level ${rating.level} is not a whole number from ${MIN_KHUSHU_LEVEL} to ${MAX_KHUSHU_LEVEL}`
    );
  }
  const custom = rating.customDistraction?.trim() ?? "";
  if (custom.length > MAX_CUSTOM_DISTRACTION_LENGTH) {
    throw new InvalidKhushuError(
      "customDistraction",
      `a typed Distraction is limited to ${MAX_CUSTOM_DISTRACTION_LENGTH} characters`
    );
  }
  return {
    date: rating.date,
    salah: rating.salah,
    level: rating.level,
    distractions: DISTRACTIONS.filter((distraction) =>
      rating.distractions.includes(distraction)
    ),
    customDistraction: custom === "" ? null : custom,
  };
};
