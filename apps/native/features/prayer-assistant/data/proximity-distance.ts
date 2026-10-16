import * as SecureStore from "expo-secure-store";

import { deviceEntry } from "@/shared/lib/device-entries";

// Proximity mode's calibration belongs to this phone's sensor, not to the
// Believer's records: how near their forehead reads, and the range it reads
// against. A device entry, so account deletion forgets it.

const PROXIMITY_KEY = deviceEntry("alrisali.prayerAssistant.proximity");

interface KeptDistance {
  distance: number;
  maxRange: number;
}

/** The nearest distance this device learned from an earlier sujud, or null. */
export const readProximityDistance = (): KeptDistance | null => {
  try {
    const kept: unknown = JSON.parse(SecureStore.getItem(PROXIMITY_KEY) ?? "");
    if (
      typeof kept === "object" &&
      kept !== null &&
      "distance" in kept &&
      "maxRange" in kept &&
      typeof kept.distance === "number" &&
      typeof kept.maxRange === "number" &&
      Number.isFinite(kept.distance) &&
      Number.isFinite(kept.maxRange)
    ) {
      return { distance: kept.distance, maxRange: kept.maxRange };
    }
  } catch {
    // Nothing kept yet.
  }
  return null;
};

/** Keeps a sujud's nearest distance for the next Salah on this device. */
export const keepProximityDistance = (kept: KeptDistance): void => {
  SecureStore.setItem(PROXIMITY_KEY, JSON.stringify(kept));
};
