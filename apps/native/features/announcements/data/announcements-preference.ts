import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { deviceEntry } from "@/shared/lib/device-entries";

// Whether this device receives Announcements. A device setting: the server
// knows devices by push token, Guests' included, so the choice is kept with
// the device and sent with every check-in.
const STORAGE_KEY = deviceEntry("alrisali.announcements");

const readEnabled = (): boolean => {
  try {
    const stored: unknown = JSON.parse(
      SecureStore.getItem(STORAGE_KEY) ?? "{}"
    );
    return !(
      typeof stored === "object" &&
      stored !== null &&
      "enabled" in stored &&
      stored.enabled === false
    );
  } catch {
    return true;
  }
};

interface AnnouncementsPreference {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useAnnouncementsPreference = create<AnnouncementsPreference>()(
  (set) => ({
    enabled: readEnabled(),
    setEnabled: (enabled) => {
      SecureStore.setItem(STORAGE_KEY, JSON.stringify({ enabled }));
      set({ enabled });
    },
  })
);
