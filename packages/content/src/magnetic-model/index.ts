import { WMM2025_COEFFICIENTS } from "./data/wmm2025";

/**
 * A spherical-harmonic model of the Earth's main magnetic field: Gauss
 * coefficients at an epoch and their yearly change, valid over a span of
 * decimal years.
 */
export interface MagneticModel {
  name: string;
  /** The decimal year the coefficients are given at. */
  epoch: number;
  /** The model is valid from the epoch until (but not including) this year. */
  validUntil: number;
  /** `[n, m, g, h, gDot, hDot]` per degree n and order m, in nT and nT/yr. */
  coefficients: typeof WMM2025_COEFFICIENTS;
}

/**
 * The World Magnetic Model 2025 (NOAA NCEI / BGS, public domain;
 * notices/wmm.md), the model phone compasses are corrected with.
 */
export const WORLD_MAGNETIC_MODEL: MagneticModel = {
  name: "WMM-2025",
  epoch: 2025,
  validUntil: 2030,
  coefficients: WMM2025_COEFFICIENTS,
};
