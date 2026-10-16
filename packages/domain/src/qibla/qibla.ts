import { distanceKm } from "../shared/location";
import type { Location } from "../shared/location";

type Coordinates = Pick<Location, "latitude" | "longitude">;

/** Where the Kaaba stands. */
export const KAABA: Coordinates = { latitude: 21.4225, longitude: 39.8262 };

/** Within this many degrees either side of the Qibla, the device faces it. */
export const FACING_QIBLA_DEGREES = 5;

/** Within this many degrees either side of the Qibla, the device is near it. */
export const NEAR_QIBLA_DEGREES = 15;

/**
 * How much of each new compass reading a smoothed heading takes (0–1): lower
 * is steadier but slower to follow the device.
 */
export const HEADING_SMOOTHING = 0.25;

export type QiblaAlignment = "facing" | "near" | "away";

const FULL_TURN = 360;
const HALF_TURN = 180;
const RADIANS = Math.PI / HALF_TURN;

const normalize = (degrees: number): number =>
  ((degrees % FULL_TURN) + FULL_TURN) % FULL_TURN;

/**
 * The Qibla from a place: the initial great-circle bearing to the Kaaba, in
 * degrees clockwise from true north (0 ≤ bearing < 360).
 */
export const qiblaBearing = ({ latitude, longitude }: Coordinates): number => {
  const from = latitude * RADIANS;
  const to = KAABA.latitude * RADIANS;
  const dLongitude = (KAABA.longitude - longitude) * RADIANS;
  const x = Math.sin(dLongitude) * Math.cos(to);
  const y =
    Math.cos(from) * Math.sin(to) -
    Math.sin(from) * Math.cos(to) * Math.cos(dLongitude);
  return normalize(Math.atan2(x, y) / RADIANS);
};

/** How far the Kaaba is from a place, in kilometres. */
export const qiblaDistanceKm = (from: Coordinates): number =>
  distanceKm(from, KAABA);

/**
 * How far to turn from a heading to face a bearing, the short way round:
 * positive is clockwise (to the right), between -180 and 180.
 */
export const qiblaOffset = (heading: number, bearing: number): number => {
  const offset = normalize(bearing - heading);
  return offset > HALF_TURN ? offset - FULL_TURN : offset;
};

/** How closely a heading faces a Qibla bearing: facing, near or away. */
export const qiblaAlignment = (
  heading: number,
  bearing: number
): QiblaAlignment => {
  const off = Math.abs(qiblaOffset(heading, bearing));
  if (off <= FACING_QIBLA_DEGREES) {
    return "facing";
  }
  return off <= NEAR_QIBLA_DEGREES ? "near" : "away";
};

/**
 * A circular low-pass filter on compass readings: moves the previous smoothed
 * heading part of the way to a new reading, the short way round, so 359° → 1°
 * passes through north instead of swinging back through south.
 */
export const smoothHeading = (
  previous: number | null,
  reading: number,
  weight: number = HEADING_SMOOTHING
): number =>
  previous === null
    ? normalize(reading)
    : normalize(previous + weight * qiblaOffset(previous, reading));

/**
 * A magnetic compass heading corrected to true north with the local
 * declination (east positive), in degrees clockwise from true north
 * (0 ≤ heading < 360).
 */
export const trueHeading = (magnetic: number, declination: number): number =>
  normalize(magnetic + declination);
