import { distanceKm } from "../shared/location";
import type { Location } from "../shared/location";

type Coordinates = Pick<Location, "latitude" | "longitude">;

/** Where the Kaaba stands. */
export const KAABA: Coordinates = { latitude: 21.4225, longitude: 39.8262 };

/**
 * How far either side of the Qibla still counts as facing it, in degrees.
 * Phone compasses are rarely truer than this.
 */
export const FACING_QIBLA_TOLERANCE = 8;

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

/** Whether a heading faces a Qibla bearing within the tolerance. */
export const isFacingQibla = (
  heading: number,
  bearing: number,
  tolerance: number = FACING_QIBLA_TOLERANCE
): boolean => Math.abs(qiblaOffset(heading, bearing)) <= tolerance;
