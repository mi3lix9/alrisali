// How far the Believer has recited: holding the text writes words one by one;
// a timed pace writes them on its own, paused by a hold or the pause button;
// voice follows what the matcher heard; hybrid listens and also advances
// while held, on one shared place. Only a restart moves backwards.

export const RECITE_MODES = ["hold", "auto", "voice", "hybrid"] as const;

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
  /** Whether the timed pace or listening is paused by the pause button. */
  paused: boolean;
}

export type ReciteEvent =
  | { type: "tick" }
  | { type: "press" }
  | { type: "release" }
  | { type: "togglePause" }
  | { type: "restart" }
  | { type: "setMode"; mode: ReciteMode }
  /** The matcher's place after the latest transcript. */
  | { type: "heard"; count: number };

/** Whether the method listens to the Believer's voice. */
export const usesVoice = (mode: ReciteMode): boolean =>
  mode === "voice" || mode === "hybrid";

/** The touch method used when speech is unavailable. */
export const withoutVoice = (mode: ReciteMode): ReciteMode =>
  usesVoice(mode) ? "hold" : mode;

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
  switch (progress.mode) {
    case "hold":
    case "hybrid": {
      return progress.holding;
    }
    case "auto": {
      return !(progress.holding || progress.paused);
    }
    default: {
      return false;
    }
  }
};

/** Whether the microphone should be on: drives the speech session. */
export const isListening = (progress: ReciteProgress): boolean =>
  usesVoice(progress.mode) &&
  !progress.paused &&
  progress.count < progress.total;

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
      const advancesOnHold =
        progress.mode === "hold" || progress.mode === "hybrid";
      return advancesOnHold && !progress.holding ? advanced(held) : held;
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
    case "heard": {
      if (!usesVoice(progress.mode)) {
        return progress;
      }
      return {
        ...progress,
        count: Math.max(progress.count, Math.min(progress.total, event.count)),
      };
    }
    default: {
      return progress;
    }
  }
};
