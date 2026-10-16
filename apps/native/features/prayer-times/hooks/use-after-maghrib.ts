import {
  calculatePrayerTimes,
  isAfterMaghrib,
  locationTimeZone,
} from "@alrisali/domain/shared";

import { useNow } from "./use-now";
import { usePrayerTimesView } from "./use-prayer-times-settings";

const MINUTE_MS = 60_000;

/**
 * Whether it is Maghrib or later today at the Believer's location, on its own
 * clock: from then on night content (tonight's dua) is offered. False while
 * there is no location or Maghrib cannot be computed.
 */
export const useAfterMaghrib = (): boolean => {
  const view = usePrayerTimesView();
  const now = useNow(MINUTE_MS);
  if (!view?.settings) {
    return false;
  }
  const timeZone = locationTimeZone(view.settings.coordinates);
  const local = now.toZonedDateTimeISO(timeZone);
  const { maghrib } = calculatePrayerTimes(
    local.toPlainDate(),
    timeZone,
    view.settings
  );
  return isAfterMaghrib(local, maghrib);
};
