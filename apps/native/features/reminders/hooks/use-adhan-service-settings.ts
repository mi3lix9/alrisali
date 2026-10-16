import { DEFAULT_ADHAN_SERVICE_SETTINGS } from "@alrisali/domain/reminders";
import type { AdhanServiceSettings } from "@alrisali/domain/reminders";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { androidAlerts } from "@/shared/lib/android-alerts";

/**
 * The Android adhan service's settings, kept by the native module itself
 * (it reads them when the alarm fires, with the app closed). `null` when
 * there is no adhan service (iOS, or a build without the module).
 */
export const useAdhanServiceSettings = () => {
  const [settings, setSettings] = useState<AdhanServiceSettings | null>(
    androidAlerts ? androidAlerts.getAdhanSettings() : null
  );
  const [fullScreenAllowed, setFullScreenAllowed] = useState(
    androidAlerts?.canUseFullScreenIntent() ?? false
  );

  // The Believer may allow or revoke the full-screen permission in Android's
  // settings: read it again on return.
  useEffect(() => {
    if (!androidAlerts) {
      return;
    }
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setFullScreenAllowed(androidAlerts?.canUseFullScreenIntent() ?? false);
      }
    });
    return () => subscription.remove();
  }, []);

  const update = useCallback((change: Partial<AdhanServiceSettings>) => {
    if (!androidAlerts) {
      return;
    }
    const next = {
      ...DEFAULT_ADHAN_SERVICE_SETTINGS,
      ...androidAlerts.getAdhanSettings(),
      ...change,
    };
    androidAlerts.setAdhanSettings(next);
    setSettings(next);
  }, []);

  return {
    settings,
    fullScreenAllowed,
    update,
    openFullScreenSettings: () => androidAlerts?.openFullScreenIntentSettings(),
  };
};
