import { WORLD_MAGNETIC_MODEL } from "@alrisali/content/magnetic-model";
import type { MagneticModel } from "@alrisali/content/magnetic-model";
import type { Temporal } from "temporal-polyfill";

import type { Location } from "../shared/location";

type Coordinates = Pick<Location, "latitude" | "longitude">;

const RADIANS = Math.PI / 180;
/** WGS84 semi-major axis, km. */
const WGS84_A = 6378.137;
/** WGS84 flattening. */
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = WGS84_F * (2 - WGS84_F);
/** The model's geomagnetic reference radius, km. */
const REFERENCE_RADIUS = 6371.2;
/** Keeps the east component finite at the geographic poles. */
const MIN_SIN_COLATITUDE = 1e-10;

/** A date as a decimal year, the WMM's time axis (2026-10-15 → 2026.7863). */
const decimalYear = (date: Temporal.PlainDate): number =>
  date.year + (date.dayOfYear - 1) / date.daysInYear;

/** Geodetic latitude and height to geocentric latitude and radius (km). */
const geocentric = (latitude: number, heightKm: number) => {
  const sin = Math.sin(latitude * RADIANS);
  const cos = Math.cos(latitude * RADIANS);
  const curvature = WGS84_A / Math.sqrt(1 - WGS84_E2 * sin * sin);
  const p = (curvature + heightKm) * cos;
  const z = (curvature * (1 - WGS84_E2) + heightKm) * sin;
  const radius = Math.hypot(p, z);
  return { latitude: Math.asin(z / radius), radius };
};

/**
 * Gauss-normalised associated Legendre functions P[n][m] of cos θ and their
 * derivatives by θ, the geocentric colatitude, by the usual recursion.
 */
const gaussLegendre = (degree: number, colatitude: number) => {
  const cos = Math.cos(colatitude);
  const sin = Math.sin(colatitude);
  const p: number[][] = [[1]];
  const dp: number[][] = [[0]];
  for (let n = 1; n <= degree; n += 1) {
    const prev = p[n - 1] ?? [];
    const dprev = dp[n - 1] ?? [];
    const prev2 = p[n - 2] ?? [];
    const dprev2 = dp[n - 2] ?? [];
    const diagonal = prev[n - 1] ?? 0;
    const pn: number[] = [];
    const dpn: number[] = [];
    for (let m = 0; m < n; m += 1) {
      const k = ((n - 1) ** 2 - m ** 2) / ((2 * n - 1) * (2 * n - 3));
      const above = prev[m] ?? 0;
      pn.push(cos * above - k * (prev2[m] ?? 0));
      dpn.push(cos * (dprev[m] ?? 0) - sin * above - k * (dprev2[m] ?? 0));
    }
    pn.push(sin * diagonal);
    dpn.push(sin * (dprev[n - 1] ?? 0) + cos * diagonal);
    p.push(pn);
    dp.push(dpn);
  }
  return { p, dp };
};

/** The factors S[n][m] that turn Gauss into Schmidt semi-normalisation. */
const schmidtFactors = (degree: number): number[][] => {
  const factors: number[][] = [[1]];
  let zonal = 1;
  for (let n = 1; n <= degree; n += 1) {
    zonal *= (2 * n - 1) / n;
    const row = [zonal];
    for (let m = 1; m <= n; m += 1) {
      const previous = row[m - 1] ?? 0;
      row.push(
        previous * Math.sqrt(((n - m + 1) * (m === 1 ? 2 : 1)) / (n + m))
      );
    }
    factors.push(row);
  }
  return factors;
};

/**
 * The magnetic declination at a place and date: how far magnetic north lies
 * east (positive) or west (negative) of true north, in degrees, from the
 * World Magnetic Model. Height is above the WGS84 ellipsoid, in km. Dates
 * outside the model's span are extrapolated.
 */
export const magneticDeclination = (
  { latitude, longitude }: Coordinates,
  date: Temporal.PlainDate,
  heightKm = 0,
  model: MagneticModel = WORLD_MAGNETIC_MODEL
): number => {
  const years = decimalYear(date) - model.epoch;
  const centre = geocentric(latitude, heightKm);
  const colatitude = Math.PI / 2 - centre.latitude;
  const degree = Math.max(...model.coefficients.map(([n]) => n));
  const { p, dp } = gaussLegendre(degree, colatitude);
  const schmidt = schmidtFactors(degree);
  const lambda = longitude * RADIANS;
  const ratio = REFERENCE_RADIUS / centre.radius;

  let north = 0;
  let east = 0;
  let down = 0;
  for (const [n, m, g0, h0, gDot, hDot] of model.coefficients) {
    const g = g0 + years * gDot;
    const h = h0 + years * hDot;
    // Schmidt semi-normalised, scaled by (a/r)^(n+2).
    const scale = ratio ** (n + 2) * (schmidt[n]?.[m] ?? 0);
    const cos = Math.cos(m * lambda);
    const sin = Math.sin(m * lambda);
    const pnm = p[n]?.[m] ?? 0;
    north += scale * (g * cos + h * sin) * (dp[n]?.[m] ?? 0);
    east += scale * m * (g * sin - h * cos) * pnm;
    down -= scale * (n + 1) * (g * cos + h * sin) * pnm;
  }
  east /= Math.max(Math.sin(colatitude), MIN_SIN_COLATITUDE);

  // From the geocentric sphere back to the geodetic frame (east is shared).
  const tilt = centre.latitude - latitude * RADIANS;
  const geodeticNorth = north * Math.cos(tilt) - down * Math.sin(tilt);
  return Math.atan2(east, geodeticNorth) / RADIANS;
};
