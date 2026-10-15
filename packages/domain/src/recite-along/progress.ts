// How far the Believer has recited, driven by touch: holding the text writes
// words one by one; a timed pace writes them on its own, paused by a hold or
// the pause button. Only a restart moves backwards.

export const RECITE_MODES = ["hold", "auto"] as const;

export type ReciteMode = (typeof RECITE_MODES)[number];

export const RECITE_PACES = ["slow", "normal", "fast"] as const;

export type RecitePace = (typeof RECITE_PACES)[number];

/** Milliseconds per word at each pace. */
export const PACE_MS: Record<RecitePace, number> = {
  slow: 1100,
  normal: 750,
  fast: 480,
};

export interface ReciteProgress {
  mode: ReciteMode;
  /** How many words have been recited. */
  count: number;
  /** How many words the text has. */
  total: number;
  /** Whether the Believer's finger is on the text. */
  holding: boolean;
  /** Whether the timed pace is paused by the pause button. */
  paused: boolean;
}

export type ReciteEvent =
  | { type: "tick" }
  | { type: "press" }
  | { type: "release" }
  | { type: "togglePause" }
  | { type: "restart" }
  | { type: "setMode"; mode: ReciteMode };

export const initialProgress = (
  mode: ReciteMode,
  total: number
): ReciteProgress => ({
  mode,
  count: 0,
  total,
  holding: false,
  paused: false,
});

/** Whether the next tick writes a word: drives the pace timer. */
export const isAdvancing = (progress: ReciteProgress): boolean => {
  if (progress.count >= progress.total) {
    return false;
  }
  return progress.mode === "hold"
    ? progress.holding
    : !(progress.holding || progress.paused);
};

const advanced = (progress: ReciteProgress): ReciteProgress => ({
  ...progress,
  count: Math.min(progress.total, progress.count + 1),
});

export const reciteStep = (
  progress: ReciteProgress,
  event: ReciteEvent
): ReciteProgress => {
  switch (event.type) {
    case "tick": {
      return isAdvancing(progress) ? advanced(progress) : progress;
    }
    case "press": {
      const held = { ...progress, holding: true };
      // The first word appears as soon as a hold begins.
      return progress.mode === "hold" && !progress.holding
        ? advanced(held)
        : held;
    }
    case "release": {
      return { ...progress, holding: false };
    }
    case "togglePause": {
      return { ...progress, paused: !progress.paused };
    }
    case "restart": {
      return initialProgress(progress.mode, progress.total);
    }
    case "setMode": {
      return {
        ...initialProgress(event.mode, progress.total),
        count: progress.count,
      };
    }
    default: {
      return progress;
    }
  }
};
