import { z } from "zod";

/** How long the Prayer Assistant waits in each Position before moving on. */
export const PACES = ["slow", "normal", "fast", "custom"] as const;

export type Pace = (typeof PACES)[number];

export const paceSchema = z.enum(PACES);

/** The two holds a Believer tunes for a Custom Pace, in milliseconds. */
export interface CustomPace {
  /** How long a sensed Position must hold before it counts. */
  holdMs: number;
  /** How long the Believer must sit before a Tashahhud counts. */
  tashahhudMs: number;
}

/** Safe range for each Custom Pace hold, as the old app allowed. */
export const CUSTOM_PACE_LIMITS = {
  holdMs: { min: 300, max: 2500 },
  tashahhudMs: { min: 1000, max: 8000 },
} as const satisfies Record<keyof CustomPace, { min: number; max: number }>;

export const PACE_PRESETS = {
  slow: { holdMs: 1200, tashahhudMs: 4000 },
  normal: { holdMs: 800, tashahhudMs: 3000 },
  fast: { holdMs: 500, tashahhudMs: 2000 },
} as const satisfies Record<Exclude<Pace, "custom">, CustomPace>;

export const customPaceSchema = z.object({
  holdMs: z
    .number()
    .int()
    .min(CUSTOM_PACE_LIMITS.holdMs.min)
    .max(CUSTOM_PACE_LIMITS.holdMs.max),
  tashahhudMs: z
    .number()
    .int()
    .min(CUSTOM_PACE_LIMITS.tashahhudMs.min)
    .max(CUSTOM_PACE_LIMITS.tashahhudMs.max),
});

/** The Believer's Pace; a Custom Pace carries its own holds. */
export type PaceChoice =
  | { pace: Exclude<Pace, "custom"> }
  | { pace: "custom"; custom: CustomPace };

/** Every hold the rak'ah machine needs, derived from one Pace. */
export interface PaceHolds {
  /** A sensed Position holds this long before it counts. */
  positionMs: number;
  /** Rising for the next Rak'ah counts sooner: the Believer stands to recite. */
  risingMs: number;
  /** Sitting this long counts as a Tashahhud. */
  tashahhudMs: number;
  /**
   * The final Tashahhud ends the Salah after this long: long enough for the
   * tashahhud, salawat and salam, not just to recognise the sitting.
   */
  finalTashahhudMs: number;
}

// The rise to the next Rak'ah scales with the hold (450 ms at Normal's
// 800 ms), but never drops below a single-frame flicker.
const RISING_RATIO = 450 / 800;
const RISING_FLOOR_MS = 250;

// Final Tashahhud length per preset (Fast 8 s, Normal 12 s, Slow 18 s); a
// Custom Pace interpolates between them by its Tashahhud hold.
const FINAL_TASHAHHUD_ANCHORS = [
  [PACE_PRESETS.fast.tashahhudMs, 8000],
  [PACE_PRESETS.normal.tashahhudMs, 12_000],
  [PACE_PRESETS.slow.tashahhudMs, 18_000],
] as const;

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, Math.round(value)));

const finalTashahhudMs = (tashahhudMs: number): number => {
  const [fast, normal, slow] = FINAL_TASHAHHUD_ANCHORS;
  const [[x1, y1], [x2, y2]] =
    tashahhudMs <= normal[0] ? [fast, normal] : [normal, slow];
  const within = Math.min(x2, Math.max(x1, tashahhudMs));
  return Math.round(y1 + ((within - x1) / (x2 - x1)) * (y2 - y1));
};

const holdsOf = (choice: PaceChoice): CustomPace =>
  choice.pace === "custom"
    ? {
        holdMs: clamp(choice.custom.holdMs, CUSTOM_PACE_LIMITS.holdMs),
        tashahhudMs: clamp(
          choice.custom.tashahhudMs,
          CUSTOM_PACE_LIMITS.tashahhudMs
        ),
      }
    : PACE_PRESETS[choice.pace];

/** The holds for a Pace; a Custom Pace is kept within its limits. */
export const paceHolds = (choice: PaceChoice): PaceHolds => {
  const { holdMs, tashahhudMs } = holdsOf(choice);
  return {
    positionMs: holdMs,
    risingMs: Math.min(
      holdMs,
      Math.max(RISING_FLOOR_MS, Math.round(holdMs * RISING_RATIO))
    ),
    tashahhudMs,
    finalTashahhudMs: finalTashahhudMs(tashahhudMs),
  };
};
