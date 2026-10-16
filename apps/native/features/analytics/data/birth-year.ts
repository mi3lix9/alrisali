import { BIRTH_YEAR_MIN } from "@alrisali/domain/analytics";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { deviceEntry } from "@/shared/lib/device-entries";

// Account deletion forgets it with the other device entries.
const BIRTH_YEAR_KEY = deviceEntry("alrisali.birth-year");

const readBirthYear = (): number | null => {
  const year = Number(SecureStore.getItem(BIRTH_YEAR_KEY));
  return Number.isInteger(year) && year >= BIRTH_YEAR_MIN ? year : null;
};

interface BirthYearState {
  birthYear: number | null;
  setBirthYear: (birthYear: number | null) => void;
}

/**
 * The birth year the Believer chose to give, for the Admins' age report. It
 * stays on this device and travels only as a number with usage events.
 */
export const useBirthYear = create<BirthYearState>()((set) => ({
  birthYear: readBirthYear(),
  setBirthYear: (birthYear) => {
    if (birthYear === null) {
      SecureStore.deleteItemAsync(BIRTH_YEAR_KEY);
    } else {
      SecureStore.setItem(BIRTH_YEAR_KEY, String(birthYear));
    }
    set({ birthYear });
  },
}));
