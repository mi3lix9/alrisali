import type { PaceHolds } from "./pace";
import { currentStep } from "./rakah-machine";
import type { AssistantState, Sighting } from "./rakah-machine";

// Mat mode: the phone lies face-up on the prayer mat, front camera to the
// ceiling, where the Believer's head comes down in sujud. The only thing the
// camera sees is the ceiling's light dimming as they bow over it, so each
// sujud is a luminance dip. Everything else (standing, Ruku, rising) happens
// out of view and follows from the order of a Salah: a sujud means the
// Believer passed through Qiyam, Ruku and I'tidal; rising between two sujuds
// is the Jalsa; sitting on after the last sujud is a Tashahhud. A port of the
// old app's mat detector and sequencer, each threshold guarding a failure it
// met on real phones.

/** One camera frame's luminance: the mean and spatial variance of its sampled Y plane, 0 to 1. */
export interface LumaFrame {
  /** When the frame was read, on the monotonic clock. */
  at: number;
  mean: number;
  variance: number;
}

/**
 * How dim a frame must be, as a share of the ceiling's calibrated
 * brightness, to count as covered (and how bright again to uncover).
 */
export interface CoverThresholds {
  /** Covered when the frame is dimmer than this. */
  coverRatio: number;
  /** Covered when this dim and the ceiling's texture or recent light is gone too. */
  shadowRatio: number;
  /** Uncovered again when brighter than this. */
  uncoverRatio: number;
}

/**
 * Tolerant until the Believer's own sujud teaches better: the head hovers
 * 10–30 cm over the lens, side light still reaches it and auto-exposure
 * raises the gain, so a sujud dims the ceiling to 50–75 %, not to black.
 */
export const DEFAULT_COVER_THRESHOLDS: CoverThresholds = {
  coverRatio: 0.6,
  shadowRatio: 0.78,
  uncoverRatio: 0.85,
};

/** A sujud dimming the ceiling less than this leaves too little signal over sensor noise. */
export const MAX_USEFUL_DIP = 0.88;

/** How long the camera looks at the ceiling to learn its brightness. */
export const MAT_CALIBRATION_MS = 1600;

/**
 * Lock the exposure this far into calibration: auto-exposure has settled on
 * the ceiling, and a locked exposure turns a sujud into a real dip instead of
 * a gain change. The baseline keeps drifting slowly, absorbing the frames
 * before the lock.
 */
export const MAT_EXPOSURE_LOCK_MS = Math.round(MAT_CALIBRATION_MS * 0.6);

/** A cover or uncover must last this long to count: hands and passing shadows don't. */
const SUSTAIN_MS = 350;
/** Near-black is always covered. */
const COVER_FLOOR = 0.02;
/** A ceiling this dark can hardly dim further: warn and suggest a light. */
const TOO_DARK_BASELINE = 0.12;
/** A ceiling flatter than this has no texture for a sujud to hide. */
const FLAT_VARIANCE = 0.004;
/** A shadowed lens has lost most of the ceiling's texture. */
const VARIANCE_COLLAPSE = 0.3;
/** Uncovering needs the texture back: auto-exposure can brighten a covered lens, but it stays flat. */
const VARIANCE_RECOVERY = 0.3;
/** The baseline follows the room's light by this share per 100 ms while uncovered. */
const BASELINE_DRIFT = 0.02;
const DRIFT_PERIOD_MS = 100;
/**
 * A frame this much dimmer than the brightest of the last two seconds is a
 * bend coming down: it catches the first dip on a flat ceiling before
 * auto-exposure (about a second) raises the gain back.
 */
const TEMPORAL_DROP_RATIO = 0.78;
const RECENT_MS = 2000;

/** A covered lens brightening for less than this is auto-exposure flicker, not rising. */
const GAP_TOLERANCE_MS = 600;

// A cover must last as long as a quick sujud before it counts, so a child
// walking past the phone moves nothing: twice the Pace's hold, at least a
// walking pass and at most a quick sujud.
const PROBATION_RATIO = 2;
const PROBATION_MIN_MS = 1200;
const PROBATION_MAX_MS = 2400;

// Standing up after the middle Tashahhud is out of view: after this long
// seated (5.5 s at Normal) the next Rak'ah begins. Enough to recite even at
// Fast, never so long that a long Custom Tashahhud feels stuck.
const DWELL_RATIO = 5500 / 3000;
const DWELL_MIN_MS = 3000;
const DWELL_MAX_MS = 9000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** How long a cover must last to count as a sujud, from the Pace. */
export const matProbationMs = (holds: PaceHolds): number =>
  clamp(
    Math.round(holds.positionMs * PROBATION_RATIO),
    PROBATION_MIN_MS,
    PROBATION_MAX_MS
  );

/** How long the Believer sits in the middle Tashahhud before the next Rak'ah, from the Pace. */
export const matDwellMs = (holds: PaceHolds): number =>
  clamp(
    Math.round(holds.tashahhudMs * DWELL_RATIO),
    DWELL_MIN_MS,
    DWELL_MAX_MS
  );

/**
 * The device's own thresholds, from the deepest dip of a real sujud (its
 * mean over the baseline, 0 to 1): covering 40 % of the way from that dip
 * back to the ceiling, so a slightly shallower sujud still counts.
 * Personalising only loosens the defaults. Null when the dip is too shallow
 * to rely on.
 */
export const thresholdsFromDip = (dip: number): CoverThresholds | null => {
  if (!Number.isFinite(dip) || dip < 0 || dip > MAX_USEFUL_DIP) {
    return null;
  }
  const depth = Math.max(dip, 0.05);
  const coverRatio = clamp(
    depth + (1 - depth) * 0.4,
    DEFAULT_COVER_THRESHOLDS.coverRatio,
    0.92
  );
  const uncoverRatio = clamp(
    coverRatio + Math.max(0.05, (1 - coverRatio) * 0.4),
    DEFAULT_COVER_THRESHOLDS.uncoverRatio,
    0.97
  );
  const shadowRatio = clamp(
    (coverRatio + uncoverRatio) / 2,
    DEFAULT_COVER_THRESHOLDS.shadowRatio,
    uncoverRatio - 0.02
  );
  return { coverRatio, shadowRatio, uncoverRatio };
};

interface Calibration {
  /** The first frame of calibration; null before it. */
  since: number | null;
  sum: number;
  varianceSum: number;
  count: number;
}

interface CoverDetector {
  thresholds: CoverThresholds;
  /** Learning the ceiling; null once it is known. */
  calibration: Calibration | null;
  baseline: number;
  baselineVariance: number;
  covered: boolean;
  /** When the frames started asking for the other state. */
  flipSince: number | null;
  /** Uncovered frames of the last two seconds, for the temporal path. */
  recent: readonly { at: number; mean: number }[];
  lastAt: number | null;
}

interface Candidate {
  /** Covered time accrued so far; uncovered blips add nothing. */
  coveredMs: number;
  lastCoveredAt: number;
  lastFrameCovered: boolean;
  /** The darkest covered frame over the baseline so far. */
  deepest: number;
}

interface Sujud {
  lastCoveredAt: number;
  /** The darkest covered frame over the baseline: the Believer's dip. */
  deepest: number;
}

interface Sequencer {
  /** The step the sequencer last saw: its timers belong to that step. */
  index: number;
  /** A cover still proving it is a sujud. */
  candidate: Candidate | null;
  /** A cover accepted as a sujud, until the Believer rises. */
  sujud: Sujud | null;
  /** Sitting after a Rak'ah's last sujud, towards its Tashahhud. */
  seatedSince: number | null;
  /** In the middle Tashahhud, towards standing for the next Rak'ah. */
  dwellSince: number | null;
}

export interface MatReading {
  /** Still learning the ceiling: the phone should lie still. */
  calibrating: boolean;
  /** The ceiling is too dark for a sujud to dim it reliably. */
  tooDark: boolean;
  covered: boolean;
  /** How close the frame is to counting as covered, 0 to 1. */
  coverage: number;
  /**
   * The dip of this Salah's first sujud, once it has tuned the thresholds:
   * the device keeps it for the next Salah. Null until then.
   */
  learnedDip: number | null;
}

/** The Mat mode sensor between frames. */
export interface MatSensor {
  detector: CoverDetector;
  sequencer: Sequencer;
  reading: MatReading;
}

/**
 * A Mat sensor starting to learn the ceiling, with the thresholds of the
 * dip this device kept from an earlier Salah, if any.
 */
export const startMatSensor = (storedDip: number | null): MatSensor => ({
  detector: {
    thresholds:
      (storedDip === null ? null : thresholdsFromDip(storedDip)) ??
      DEFAULT_COVER_THRESHOLDS,
    calibration: { since: null, sum: 0, varianceSum: 0, count: 0 },
    baseline: 0,
    baselineVariance: 0,
    covered: false,
    flipSince: null,
    recent: [],
    lastAt: null,
  },
  sequencer: {
    index: 0,
    candidate: null,
    sujud: null,
    seatedSince: null,
    dwellSince: null,
  },
  reading: {
    calibrating: true,
    tooDark: false,
    covered: false,
    coverage: 0,
    learnedDip: null,
  },
});

/**
 * Learns the ceiling again, after the phone moved or the light changed.
 * The thresholds and anything learned stay; a cover in progress is dropped.
 */
export const recalibrateMat = (sensor: MatSensor): MatSensor => {
  const fresh = startMatSensor(null);
  return {
    detector: { ...fresh.detector, thresholds: sensor.detector.thresholds },
    sequencer: { ...fresh.sequencer, index: sensor.sequencer.index },
    reading: { ...fresh.reading, learnedDip: sensor.reading.learnedDip },
  };
};

const unit = (value: number): number => clamp(value, 0, 1);

/** The covered state this frame asks for, and how close it comes to covering. */
const judge = (
  detector: CoverDetector,
  { mean, variance }: LumaFrame
): { covered: boolean; coverage: number } => {
  const { baseline, baselineVariance, covered, thresholds } = detector;
  const coverAt = Math.max(COVER_FLOOR, baseline * thresholds.coverRatio);
  const shadowAt = baseline * thresholds.shadowRatio;
  const uncoverAt = Math.max(
    shadowAt + 0.01,
    baseline * thresholds.uncoverRatio
  );
  const textured = baselineVariance >= FLAT_VARIANCE;
  const recentMax = covered
    ? null
    : Math.max(...detector.recent.map((frame) => frame.mean), 0) || null;

  if (covered) {
    const textureBack =
      !textured || variance > baselineVariance * VARIANCE_RECOVERY;
    return { covered: !(mean > uncoverAt && textureBack), coverage: 1 };
  }

  const textureGone =
    textured && variance < baselineVariance * VARIANCE_COLLAPSE;
  const droppedFast =
    recentMax !== null &&
    mean < recentMax * TEMPORAL_DROP_RATIO &&
    mean < shadowAt;
  const dimming =
    baseline > shadowAt ? unit((baseline - mean) / (baseline - shadowAt)) : 0;
  const brightness =
    baseline > coverAt ? unit((baseline - mean) / (baseline - coverAt)) : 0;
  const shadow = textured
    ? Math.min(
        dimming,
        unit(
          (baselineVariance - variance) /
            (baselineVariance * (1 - VARIANCE_COLLAPSE))
        )
      )
    : 0;
  const temporal =
    recentMax === null
      ? 0
      : Math.min(
          dimming,
          unit((recentMax - mean) / (recentMax * (1 - TEMPORAL_DROP_RATIO)))
        );
  return {
    covered: mean < coverAt || (textureGone && mean < shadowAt) || droppedFast,
    coverage: Math.max(brightness, shadow, temporal),
  };
};

const calibrate = (
  detector: CoverDetector,
  calibration: Calibration,
  frame: LumaFrame
): CoverDetector => {
  const since = calibration.since ?? frame.at;
  const sum = calibration.sum + frame.mean;
  const varianceSum = calibration.varianceSum + frame.variance;
  const count = calibration.count + 1;
  if (frame.at - since < MAT_CALIBRATION_MS) {
    return {
      ...detector,
      calibration: { since, sum, varianceSum, count },
      lastAt: frame.at,
    };
  }
  return {
    ...detector,
    calibration: null,
    baseline: sum / count,
    baselineVariance: varianceSum / count,
    lastAt: frame.at,
  };
};

/** One frame through the cover detector: the debounced covered state and its meter. */
const detect = (
  detector: CoverDetector,
  frame: LumaFrame
): { detector: CoverDetector; coverage: number } => {
  if (detector.calibration !== null) {
    return {
      detector: calibrate(detector, detector.calibration, frame),
      coverage: 0,
    };
  }
  const wanted = judge(detector, frame);
  let next: CoverDetector = { ...detector, lastAt: frame.at };

  if (wanted.covered === detector.covered) {
    next.flipSince = null;
    if (!detector.covered) {
      // The room's light drifts (clouds, a lamp); follow it while stably uncovered.
      const elapsed = frame.at - (detector.lastAt ?? frame.at);
      const share = 1 - (1 - BASELINE_DRIFT) ** (elapsed / DRIFT_PERIOD_MS);
      next.baseline += (frame.mean - next.baseline) * share;
      next.baselineVariance += (frame.variance - next.baselineVariance) * share;
    }
  } else {
    const since = detector.flipSince ?? frame.at;
    next =
      frame.at - since >= SUSTAIN_MS
        ? { ...next, covered: wanted.covered, flipSince: null }
        : { ...next, flipSince: since };
  }

  // Only uncovered frames light the temporal path: a covered lens creeping
  // brighter must never pass for a recent bright ceiling.
  next.recent = next.covered
    ? []
    : [
        ...next.recent.filter((seen) => frame.at - seen.at < RECENT_MS),
        { at: frame.at, mean: frame.mean },
      ];

  return { detector: next, coverage: next.covered ? 1 : wanted.coverage };
};

/**
 * What an accepted sujud proves: the Believer reached the next sujud. After
 * the middle Tashahhud's Rak'ah it passed the Tashahhud too (they sat before
 * standing); before the final Tashahhud it is a sujud said again, not a new
 * Rak'ah.
 */
const sujudSightings = (state: AssistantState): Sighting[] => {
  if (currentStep(state).final) {
    return [];
  }
  const next = state.steps.find(
    (step, index) =>
      index > state.index &&
      (step.position === "sujud" || step.position === "tashahhud")
  );
  if (!next || next.final) {
    return [];
  }
  return next.position === "tashahhud"
    ? [
        { kind: "confirmed", position: "tashahhud" },
        { kind: "confirmed", position: "sujud" },
      ]
    : [{ kind: "confirmed", position: "sujud" }];
};

/** What rising from a sujud proves, by the step after it. */
const risenSightings = (
  state: AssistantState
): { sightings: Sighting[]; sitting: boolean } => {
  const step = currentStep(state);
  const following = state.steps[state.index + 1];
  if (step.position !== "sujud" || !following) {
    return { sightings: [], sitting: false };
  }
  if (following.position === "tashahhud") {
    return { sightings: [], sitting: true };
  }
  return {
    sightings: [{ kind: "confirmed", position: following.position }],
    sitting: false,
  };
};

interface Sequenced {
  sequencer: Sequencer;
  sightings: Sighting[];
  /** The dip of a sujud the Believer just rose from. */
  rose: number | null;
}

const onCovered = (
  sequencer: Sequencer,
  state: AssistantState,
  at: number,
  ratio: number
): Sequenced => {
  if (sequencer.sujud) {
    return {
      sequencer: {
        ...sequencer,
        sujud: {
          lastCoveredAt: at,
          deepest: Math.min(sequencer.sujud.deepest, ratio),
        },
      },
      sightings: [],
      rose: null,
    };
  }
  const { candidate } = sequencer;
  const coveredMs =
    candidate === null
      ? 0
      : candidate.coveredMs +
        (candidate.lastFrameCovered ? at - candidate.lastCoveredAt : 0);
  const deepest = Math.min(candidate?.deepest ?? ratio, ratio);
  if (coveredMs < matProbationMs(state.holds)) {
    return {
      sequencer: {
        ...sequencer,
        candidate: {
          coveredMs,
          lastCoveredAt: at,
          lastFrameCovered: true,
          deepest,
        },
      },
      sightings: [],
      rose: null,
    };
  }
  return {
    sequencer: {
      ...sequencer,
      candidate: null,
      sujud: { lastCoveredAt: at, deepest },
      seatedSince: null,
      dwellSince: null,
    },
    sightings: sujudSightings(state),
    rose: null,
  };
};

const onUncovered = (
  sequencer: Sequencer,
  state: AssistantState,
  at: number
): Sequenced => {
  const { candidate, sujud } = sequencer;
  let next: Sequencer = sequencer;
  if (candidate) {
    next = {
      ...next,
      candidate:
        at - candidate.lastCoveredAt > GAP_TOLERANCE_MS
          ? null
          : { ...candidate, lastFrameCovered: false },
    };
  }
  if (!sujud || at - sujud.lastCoveredAt <= GAP_TOLERANCE_MS) {
    return { sequencer: next, sightings: [], rose: null };
  }
  const risen = risenSightings(state);
  return {
    sequencer: {
      ...next,
      sujud: null,
      seatedSince: risen.sitting ? sujud.lastCoveredAt : next.seatedSince,
    },
    sightings: risen.sightings,
    rose: sujud.deepest,
  };
};

/** The Tashahhud after sitting long enough, and standing after the middle one. */
const onTimers = (
  sequencer: Sequencer,
  state: AssistantState,
  at: number,
  covered: boolean
): { sequencer: Sequencer; sightings: Sighting[] } => {
  if (sequencer.sujud) {
    return { sequencer, sightings: [] };
  }
  const step = currentStep(state);
  const following = state.steps[state.index + 1];

  if (step.position === "sujud" && following?.position === "tashahhud") {
    // A pass-by over the seated Believer neither starts nor resets the sit.
    const seatedSince = sequencer.seatedSince ?? (covered ? null : at);
    if (seatedSince !== null && at - seatedSince >= state.holds.tashahhudMs) {
      return {
        sequencer: { ...sequencer, seatedSince: null },
        sightings: [
          { kind: "confirmed", position: "tashahhud", since: seatedSince },
        ],
      };
    }
    return { sequencer: { ...sequencer, seatedSince }, sightings: [] };
  }

  if (step.position === "tashahhud" && !step.final) {
    // Wall-clock: a pass-by doesn't reset it, but a cover still proving
    // itself may be the next sujud, which advances on its own.
    const dwellSince = sequencer.dwellSince ?? at;
    if (
      sequencer.candidate === null &&
      at - dwellSince >= matDwellMs(state.holds)
    ) {
      return {
        sequencer: { ...sequencer, dwellSince: null },
        sightings: [{ kind: "confirmed", position: "qiyam" }],
      };
    }
    return { sequencer: { ...sequencer, dwellSince }, sightings: [] };
  }

  return { sequencer, sightings: [] };
};

const sequence = (
  sequencer: Sequencer,
  state: AssistantState,
  at: number,
  covered: boolean,
  ratio: number
): Sequenced => {
  // The machine moved (a tap, or the last sightings): timers start over.
  const current: Sequencer =
    sequencer.index === state.index
      ? sequencer
      : {
          ...sequencer,
          index: state.index,
          seatedSince: null,
          dwellSince: null,
        };
  const moved = covered
    ? onCovered(current, state, at, ratio)
    : onUncovered(current, state, at);
  if (moved.sightings.length > 0) {
    return moved;
  }
  const timed = onTimers(moved.sequencer, state, at, covered);
  return { ...timed, rose: moved.rose };
};

/**
 * One camera frame through Mat mode: the debounced cover, the sightings it
 * proves for the rak'ah machine (each `confirmed`), and what the screen
 * shows. Covers count only once they outlast a pass-by; the first sujud of
 * the Salah tunes the thresholds to this device and ceiling.
 */
export const readMat = (
  sensor: MatSensor,
  state: AssistantState,
  frame: LumaFrame
): { sensor: MatSensor; sightings: Sighting[]; reading: MatReading } => {
  const { lastAt } = sensor.detector;
  if (lastAt !== null && frame.at <= lastAt) {
    return { sensor, sightings: [], reading: sensor.reading };
  }
  const detected = detect(sensor.detector, frame);
  let { detector } = detected;
  const tooDark =
    detector.calibration === null && detector.baseline < TOO_DARK_BASELINE;

  // Until the ceiling is known nothing is covered; on a black ceiling
  // nothing could dim, so nothing is sequenced.
  if (
    sensor.detector.calibration !== null ||
    detector.baseline <= COVER_FLOOR ||
    state.completed
  ) {
    const reading: MatReading = {
      ...sensor.reading,
      calibrating: detector.calibration !== null,
      tooDark,
      covered: false,
      coverage: 0,
    };
    return {
      sensor: { ...sensor, detector, reading },
      sightings: [],
      reading,
    };
  }

  const sequenced = sequence(
    sensor.sequencer,
    state,
    frame.at,
    detector.covered,
    frame.mean / detector.baseline
  );

  let { learnedDip } = sensor.reading;
  if (learnedDip === null && sequenced.rose !== null) {
    const thresholds = thresholdsFromDip(sequenced.rose);
    if (thresholds) {
      detector = { ...detector, thresholds };
      learnedDip = sequenced.rose;
    }
  }

  const reading: MatReading = {
    calibrating: false,
    tooDark,
    covered: detector.covered,
    coverage: detected.coverage,
    learnedDip,
  };
  return {
    sensor: { detector, sequencer: sequenced.sequencer, reading },
    sightings: sequenced.sightings,
    reading,
  };
};
