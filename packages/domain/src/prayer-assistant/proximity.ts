import { matDwellMs, risenSightings, sujudSightings } from "./mat";
import { currentStep } from "./rakah-machine";
import type { AssistantState, Sighting } from "./rakah-machine";

// Proximity mode: the phone lies on the mat, screen up, and the forehead
// covers the proximity sensor beside the earpiece in sujud. The sensor says
// near or far (iOS gives only that; Android also reports a distance in cm and
// the sensor's range). Like Mat mode, each sujud is one cover and the rest of
// the Salah follows from the order of Positions, so a sujud proves Qiyam,
// Ruku and I'tidal before it, rising is the Jalsa, and sitting on is the
// Tashahhud. A near or far must last PROXIMITY_MIN_MS to count: a hand
// passing over the phone does not.

/** One reading of the proximity sensor. */
export interface ProximitySample {
  /** When it was read, on the monotonic clock. */
  at: number;
  /** The sensor's own near/far answer: all iOS gives. */
  near: boolean;
  /** Distance in cm, where the platform reports it (Android). */
  distance: number | null;
  /** The sensor's furthest reading in cm, where reported. */
  maxRange: number | null;
}

/** A near or far must last this long to count; shorter is a passing hand. */
export const PROXIMITY_MIN_MS = 300;

/** Without a learned sujud, a distance under this share of the range is near. */
const DEFAULT_NEAR_RATIO = 0.5;
/** Near again only below, far again only above: the gap keeps a hovering head from flickering. */
const FAR_GAP_RATIO = 0.3;
/** A threshold never rises above this share of the range: some distance must stay far. */
const MAX_NEAR_RATIO = 0.9;

/** Where distance turns near, and where it turns far again, in cm. */
export interface ProximityThresholds {
  nearBelow: number;
  farAbove: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const withGap = (nearBelow: number, maxRange: number): ProximityThresholds => ({
  nearBelow,
  farAbove: nearBelow + (maxRange - nearBelow) * FAR_GAP_RATIO,
});

/** Thresholds before this device has learned a sujud, from the sensor's range. */
export const defaultThresholds = (maxRange: number): ProximityThresholds =>
  withGap(maxRange * DEFAULT_NEAR_RATIO, maxRange);

/**
 * The device's own thresholds, from the nearest distance of a real sujud
 * (cm): turning near halfway between that and the sensor's range, so a
 * slightly higher forehead still counts. Personalising only loosens the
 * defaults. Null when the distance or range is unusable.
 */
export const thresholdsFromDistance = (
  deepest: number,
  maxRange: number
): ProximityThresholds | null => {
  if (
    !Number.isFinite(deepest) ||
    !Number.isFinite(maxRange) ||
    maxRange <= 0 ||
    deepest < 0 ||
    deepest >= maxRange * MAX_NEAR_RATIO
  ) {
    return null;
  }
  const nearBelow = clamp(
    deepest + (maxRange - deepest) * 0.5,
    maxRange * DEFAULT_NEAR_RATIO,
    maxRange * MAX_NEAR_RATIO
  );
  return withGap(nearBelow, maxRange);
};

/** What this sample says: near, far, or (between thresholds) no change. */
const judge = (
  sample: ProximitySample,
  thresholds: ProximityThresholds | null,
  was: boolean
): boolean => {
  const { distance, maxRange } = sample;
  if (distance === null || maxRange === null || maxRange <= 0) {
    return sample.near;
  }
  const { nearBelow, farAbove } = thresholds ?? defaultThresholds(maxRange);
  if (distance < nearBelow) {
    return true;
  }
  return distance > farAbove ? false : was;
};

export interface ProximityReading {
  /** Debounced: the forehead is over the sensor. */
  near: boolean;
  /**
   * The nearest distance of this Salah's first sujud, once it has tuned the
   * thresholds: the device keeps it for the next Salah. Null until then.
   */
  learnedDistance: number | null;
}

/** The Proximity mode sensor between readings. */
export interface ProximitySensor {
  thresholds: ProximityThresholds | null;
  /** Debounced near state. */
  near: boolean;
  /** When the readings started asking for the other state. */
  flipSince: number | null;
  lastAt: number | null;
  /** The step the sensor last saw: its timers belong to that step. */
  index: number;
  /** A near accepted as a sujud, until the Believer rises. */
  sujud: { lastNearAt: number; deepest: number | null } | null;
  /** Sitting after a Rak'ah's last sujud, towards its Tashahhud. */
  seatedSince: number | null;
  /** In the middle Tashahhud, towards standing for the next Rak'ah. */
  dwellSince: number | null;
  /** The sensor's range, learned from its readings. */
  maxRange: number | null;
  reading: ProximityReading;
}

/**
 * A Proximity sensor with the nearest distance this device kept from an
 * earlier Salah (and the range it was kept against), if any.
 */
export const startProximitySensor = (
  stored: { distance: number; maxRange: number } | null
): ProximitySensor => ({
  thresholds: stored
    ? thresholdsFromDistance(stored.distance, stored.maxRange)
    : null,
  near: false,
  flipSince: null,
  lastAt: null,
  index: 0,
  sujud: null,
  seatedSince: null,
  dwellSince: null,
  maxRange: null,
  reading: { near: false, learnedDistance: null },
});

/** The debounced near state after one sample. */
const debounce = (
  sensor: ProximitySensor,
  sample: ProximitySample
): Pick<ProximitySensor, "near" | "flipSince"> => {
  const wanted = judge(sample, sensor.thresholds, sensor.near);
  if (wanted === sensor.near) {
    return { near: sensor.near, flipSince: null };
  }
  const since = sensor.flipSince ?? sample.at;
  return sample.at - since >= PROXIMITY_MIN_MS
    ? { near: wanted, flipSince: null }
    : { near: sensor.near, flipSince: since };
};

/** The Tashahhud after sitting long enough, and standing after the middle one. */
const onTimers = (
  sensor: ProximitySensor,
  state: AssistantState,
  at: number
): { sensor: ProximitySensor; sightings: Sighting[] } => {
  if (sensor.sujud) {
    return { sensor, sightings: [] };
  }
  const step = currentStep(state);
  const following = state.steps[state.index + 1];

  if (step.position === "sujud" && following?.position === "tashahhud") {
    // A pass-by over the seated Believer neither starts nor resets the sit.
    const seatedSince = sensor.seatedSince ?? (sensor.near ? null : at);
    if (seatedSince !== null && at - seatedSince >= state.holds.tashahhudMs) {
      return {
        sensor: { ...sensor, seatedSince: null },
        sightings: [
          { kind: "confirmed", position: "tashahhud", since: seatedSince },
        ],
      };
    }
    return { sensor: { ...sensor, seatedSince }, sightings: [] };
  }

  if (step.position === "tashahhud" && !step.final) {
    const dwellSince = sensor.dwellSince ?? at;
    if (at - dwellSince >= matDwellMs(state.holds)) {
      return {
        sensor: { ...sensor, dwellSince: null },
        sightings: [{ kind: "confirmed", position: "qiyam" }],
      };
    }
    return { sensor: { ...sensor, dwellSince }, sightings: [] };
  }

  return { sensor, sightings: [] };
};

/** Near, held: a sujud begins, or goes on. */
const onNear = (
  sensor: ProximitySensor,
  state: AssistantState,
  { at, distance }: ProximitySample
): { sensor: ProximitySensor; sightings: Sighting[] } => {
  const held = sensor.sujud?.deepest ?? null;
  const deepest =
    distance === null || held === null
      ? (distance ?? held)
      : Math.min(distance, held);
  if (sensor.sujud) {
    return {
      sensor: { ...sensor, sujud: { lastNearAt: at, deepest } },
      sightings: [],
    };
  }
  return {
    sensor: {
      ...sensor,
      sujud: { lastNearAt: at, deepest },
      seatedSince: null,
      dwellSince: null,
    },
    sightings: sujudSightings(state),
  };
};

/** Far for the whole debounce after a sujud: the Believer rose. */
const onRise = (
  sensor: ProximitySensor,
  state: AssistantState,
  flipSince: number | null
): { sensor: ProximitySensor; sightings: Sighting[] } => {
  const { sujud } = sensor;
  if (!sujud) {
    return { sensor, sightings: [] };
  }
  const risen = risenSightings(state);
  let next: ProximitySensor = {
    ...sensor,
    sujud: null,
    seatedSince: risen.sitting
      ? (flipSince ?? sujud.lastNearAt)
      : sensor.seatedSince,
  };
  if (
    next.reading.learnedDistance === null &&
    sujud.deepest !== null &&
    next.maxRange !== null
  ) {
    const thresholds = thresholdsFromDistance(sujud.deepest, next.maxRange);
    if (thresholds) {
      next = {
        ...next,
        thresholds,
        reading: { ...next.reading, learnedDistance: sujud.deepest },
      };
    }
  }
  return { sensor: next, sightings: risen.sightings };
};

/**
 * One sensor reading through Proximity mode: the debounced near state, the
 * sightings it proves for the rak'ah machine (each `confirmed`), and what the
 * screen shows. Call it again with the latest sample on a timer while the
 * sensor is quiet: the sensor only reports changes, but a Tashahhud and a
 * 300 ms debounce still need time to pass. The first sujud of the Salah
 * tunes the thresholds to this device.
 */
export const readProximity = (
  previous: ProximitySensor,
  state: AssistantState,
  sample: ProximitySample
): {
  sensor: ProximitySensor;
  sightings: Sighting[];
  reading: ProximityReading;
} => {
  if (previous.lastAt !== null && sample.at < previous.lastAt) {
    return { sensor: previous, sightings: [], reading: previous.reading };
  }
  const { at } = sample;
  // The machine moved (a tap, or the last sightings): timers start over.
  let sensor: ProximitySensor =
    previous.index === state.index
      ? previous
      : {
          ...previous,
          index: state.index,
          seatedSince: null,
          dwellSince: null,
        };
  const wasNear = sensor.near;
  const wasFlipSince = sensor.flipSince;
  sensor = {
    ...sensor,
    ...debounce(sensor, sample),
    lastAt: at,
    maxRange: sample.maxRange ?? sensor.maxRange,
  };

  let moved: { sensor: ProximitySensor; sightings: Sighting[] } = {
    sensor,
    sightings: [],
  };
  if (state.completed) {
    moved = { sensor: { ...sensor, sujud: null }, sightings: [] };
  } else if (sensor.near) {
    moved = onNear(sensor, state, sample);
  } else if (sensor.sujud && wasNear) {
    moved = onRise(sensor, state, wasFlipSince);
  }
  ({ sensor } = moved);
  let { sightings } = moved;

  if (sightings.length === 0 && !state.completed) {
    const timed = onTimers(sensor, state, at);
    ({ sensor, sightings } = timed);
  }

  const reading: ProximityReading = {
    near: sensor.near,
    learnedDistance: sensor.reading.learnedDistance,
  };
  return { sensor: { ...sensor, reading }, sightings, reading };
};
