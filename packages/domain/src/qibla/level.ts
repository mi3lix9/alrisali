/** The phone counts as level within this many degrees of flat. */
export const LEVEL_TOLERANCE_DEGREES = 3;

/**
 * The accelerometer's reading, in g, along the device's own axes: x to the
 * right, y up the screen and z out of it. A resting phone reads the force
 * holding it up, so one lying face up reads (0, 0, 1) and a raised top edge
 * reads a positive y. (Android reports this; iOS reports the opposite sign,
 * which the native hook flips.)
 */
export interface Acceleration {
  x: number;
  y: number;
  z: number;
}

export interface Level {
  /** How far the device is from flat, in degrees (0–180). */
  tilt: number;
  /**
   * Where a bubble rests, in the circle's units: -1 to 1 along each axis, so
   * it floats to the high side and stays inside the circle.
   */
  bubble: { x: number; y: number };
  level: boolean;
}

const RADIANS = Math.PI / 180;
/** The bubble reaches the circle's edge at this tilt. */
const FULL_DEFLECTION_DEGREES = 15;

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

/**
 * How level a phone is from its accelerometer, and where the bubble goes: to
 * the high side, which is where the reading points. A phone lying face down
 * is upside down (tilt 180°), and a free-fall reading (no force) is reported
 * as level, since it has no tilt to show.
 */
export const levelFromAcceleration = ({ x, y, z }: Acceleration): Level => {
  const magnitude = Math.hypot(x, y, z);
  if (magnitude === 0) {
    return { tilt: 0, bubble: { x: 0, y: 0 }, level: true };
  }
  const tilt = Math.acos(clamp(z / magnitude)) / RADIANS;
  const deflection = (axis: number): number =>
    clamp(
      Math.asin(clamp(axis / magnitude)) / RADIANS / FULL_DEFLECTION_DEGREES
    );
  return {
    tilt,
    bubble: { x: deflection(x), y: deflection(y) },
    level: tilt <= LEVEL_TOLERANCE_DEGREES,
  };
};

/** The compass reports poor calibration at this level (0–3) or lower. */
export const LOW_COMPASS_ACCURACY = 1;

/**
 * Whether the compass needs the figure-eight: its sensor accuracy (0 =
 * unreliable to 3 = high) is low.
 */
export const needsCompassCalibration = (accuracy: number): boolean =>
  accuracy <= LOW_COMPASS_ACCURACY;
