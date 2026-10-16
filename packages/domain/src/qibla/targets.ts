import {
  KAABA_COORDINATES,
  SHRINE_COORDINATES,
  SHRINE_IDS,
} from "@alrisali/content/qibla-targets";
import { z } from "zod";

import { distanceKm } from "../shared/location";
import { bearingTo } from "./qibla";
import type { Coordinates } from "./qibla";

/**
 * What the compass points at: the Kaaba, which is the Qibla, or one of the
 * six Shrines for ziyarah. The Kaaba is first and the default.
 */
export const QIBLA_TARGET_IDS = ["kaaba", ...SHRINE_IDS] as const;

export const qiblaTargetSchema = z.enum(QIBLA_TARGET_IDS);

export type QiblaTarget = z.infer<typeof qiblaTargetSchema>;

export const DEFAULT_QIBLA_TARGET: QiblaTarget = "kaaba";

const COORDINATES: Record<QiblaTarget, Coordinates> = {
  kaaba: KAABA_COORDINATES,
  ...SHRINE_COORDINATES,
};

/** True for a Shrine: any target but the Kaaba, which is the Qibla. */
export const isShrine = (target: QiblaTarget): boolean => target !== "kaaba";

/** The bearing from a place to a target, degrees clockwise from true north. */
export const targetBearing = (from: Coordinates, target: QiblaTarget): number =>
  bearingTo(from, COORDINATES[target]);

/** How far a target is from a place, in kilometres. */
export const targetDistanceKm = (
  from: Coordinates,
  target: QiblaTarget
): number => distanceKm(from, COORDINATES[target]);
