import {
  advanceOnboarding,
  readOnboardingProgress,
} from "@alrisali/domain/onboarding";
import type {
  OnboardingProgress,
  OnboardingStep,
} from "@alrisali/domain/onboarding";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { deviceEntry } from "@/shared/lib/device-entries";
import { events } from "@/shared/lib/events";

// Whether this device has been through the first run, and where it stands
// while it is under way. Read synchronously at startup, so the shell opens
// on the right screen in its first frame. A device entry: account deletion
// forgets it, and the next launch is a first run again.

const STORAGE_KEY = deviceEntry("alrisali.onboarding");

interface FirstRunState {
  progress: OnboardingProgress;
  /** Moves past `step` (finishing after the account step) and stores it. */
  advance: (step: OnboardingStep) => void;
  /** Returns to an earlier step. */
  goTo: (step: OnboardingStep) => void;
}

export const useFirstRun = create<FirstRunState>()((set) => {
  const persist = (progress: OnboardingProgress) => {
    SecureStore.setItem(STORAGE_KEY, JSON.stringify(progress));
    set({ progress });
    if (progress.done) {
      events.emit("OnboardingCompleted");
    }
  };

  return {
    progress: readOnboardingProgress(SecureStore.getItem(STORAGE_KEY)),
    advance: (step) => persist(advanceOnboarding(step)),
    goTo: (step) => persist({ done: false, step }),
  };
});

/** Whether the first run is over: the shell opens on Home. */
export const useOnboarded = (): boolean =>
  useFirstRun((state) => state.progress.done);

/** Whether the first run is over, read outside a component. */
export const isOnboarded = (): boolean => useFirstRun.getState().progress.done;
