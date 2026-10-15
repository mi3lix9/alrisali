import * as SecureStore from "expo-secure-store";

import { deviceEntry } from "@/shared/lib/device-entries";

// Mat mode's calibration belongs to this phone and its camera, not to the
// Believer's records: how far their sujud dims this camera's view of the
// ceiling. A device entry, so account deletion forgets it.

const MAT_DIP_KEY = deviceEntry("alrisali.prayerAssistant.matDip");

/** The dip this device learned from an earlier sujud, or null. */
export const readMatDip = (): number | null => {
  const dip = Number(SecureStore.getItem(MAT_DIP_KEY) ?? Number.NaN);
  return Number.isFinite(dip) ? dip : null;
};

/** Keeps a sujud's dip for the next Salah on this device. */
export const keepMatDip = (dip: number): void => {
  SecureStore.setItem(MAT_DIP_KEY, String(dip));
};
