import { RECITE_MODES, RECITE_PACES } from "@alrisali/domain/recite-along";
import type { ReciteMode, RecitePace } from "@alrisali/domain/recite-along";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";
import { create } from "zustand";

import { deviceEntry } from "@/shared/lib/device-entries";

// The Believer's Recite-Along method and pace, kept on the device: display
// settings, not records.

const STORAGE_KEY = deviceEntry("alrisali.recite-along");

interface RecitePreferences {
  mode: ReciteMode;
  pace: RecitePace;
}

const DEFAULTS: RecitePreferences = { mode: "hold", pace: "normal" };

const storedSchema = z
  .object({ mode: z.enum(RECITE_MODES), pace: z.enum(RECITE_PACES) })
  .partial();

const readStored = (): RecitePreferences => {
  const raw = SecureStore.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULTS;
  }
  try {
    const { data } = storedSchema.safeParse(JSON.parse(raw));
    return {
      mode: data?.mode ?? DEFAULTS.mode,
      pace: data?.pace ?? DEFAULTS.pace,
    };
  } catch {
    return DEFAULTS;
  }
};

interface RecitePreferencesState extends RecitePreferences {
  setMode: (mode: ReciteMode) => void;
  setPace: (pace: RecitePace) => void;
}

export const useRecitePreferences = create<RecitePreferencesState>()((
  set,
  get
) => {
  const persist = (patch: Partial<RecitePreferences>) => {
    const { mode, pace } = { ...get(), ...patch };
    SecureStore.setItem(STORAGE_KEY, JSON.stringify({ mode, pace }));
    set(patch);
  };

  return {
    ...readStored(),
    setMode: (mode) => persist({ mode }),
    setPace: (pace) => persist({ pace }),
  };
});
