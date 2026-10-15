/** The dhikr of each Tasbih al-Zahra step, in order. */
export type TasbihAlZahraDhikr =
  | "allahu-akbar"
  | "alhamdulillah"
  | "subhanallah";

export interface TasbihAlZahraStep {
  dhikr: TasbihAlZahraDhikr;
  target: number;
}

/** Allahu Akbar ×34, Alhamdulillah ×33, Subhanallah ×33. */
export const TASBIH_AL_ZAHRA_STEPS: readonly [
  TasbihAlZahraStep,
  TasbihAlZahraStep,
  TasbihAlZahraStep,
] = [
  { dhikr: "allahu-akbar", target: 34 },
  { dhikr: "alhamdulillah", target: 33 },
  { dhikr: "subhanallah", target: 33 },
];

/** The count of a completed round: 34 + 33 + 33. */
export const TASBIH_AL_ZAHRA_ROUND = 100;

/** Where the Believer is in a round: the step's index and its count so far. */
export interface TasbihAlZahraProgress {
  step: number;
  count: number;
}

export const TASBIH_AL_ZAHRA_START: TasbihAlZahraProgress = {
  step: 0,
  count: 0,
};

/**
 * What a tap asks of the device: `tap` a light haptic, `step` a stronger one
 * as the next step begins, `round` the end of a round.
 */
export type TasbihAlZahraFeedback = "tap" | "step" | "round";

export interface TasbihAlZahraTap {
  progress: TasbihAlZahraProgress;
  feedback: TasbihAlZahraFeedback;
  /** The count of the Dhikr Session to record, on the tap that ends a round. */
  dhikrSessionCount: number | null;
}

/**
 * Reads saved progress (from this device, or synced from another), starting
 * over when it does not describe a point inside a round.
 */
export const restoreTasbihAlZahra = (
  saved: TasbihAlZahraProgress
): TasbihAlZahraProgress => {
  const step = TASBIH_AL_ZAHRA_STEPS[saved.step];
  const valid =
    step !== undefined &&
    Number.isInteger(saved.step) &&
    Number.isInteger(saved.count) &&
    saved.count >= 0 &&
    saved.count < step.target;
  return valid
    ? { step: saved.step, count: saved.count }
    : TASBIH_AL_ZAHRA_START;
};

/**
 * Counts one tap. Synchronous and pure, so the count never waits on storage
 * or sync. The tap that completes a step advances to the next; the tap that
 * completes the last step yields a Dhikr Session of 100 and starts over.
 */
export const tapTasbihAlZahra = (
  progress: TasbihAlZahraProgress
): TasbihAlZahraTap => {
  const { step, count } = restoreTasbihAlZahra(progress);
  const target = TASBIH_AL_ZAHRA_STEPS[step]?.target ?? 0;
  const next = count + 1;
  if (next < target) {
    return {
      progress: { step, count: next },
      feedback: "tap",
      dhikrSessionCount: null,
    };
  }
  if (TASBIH_AL_ZAHRA_STEPS[step + 1]) {
    return {
      progress: { step: step + 1, count: 0 },
      feedback: "step",
      dhikrSessionCount: null,
    };
  }
  return {
    progress: TASBIH_AL_ZAHRA_START,
    feedback: "round",
    dhikrSessionCount: TASBIH_AL_ZAHRA_ROUND,
  };
};
