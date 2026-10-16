import {
  calculatePrayerTimes,
  isAfterMaghrib,
  locationTimeZone,
  nightHijriDate,
} from "@alrisali/domain/shared";
import type { HijriDate } from "@alrisali/domain/shared";

import { useHijriCalendar } from "@/shared/lib/hijri-calendar";

import { useNow } from "./use-now";
import { usePrayerTimesView } from "./use-prayer-times-settings";

const MINUTE_MS = 60_000;

/**
 * The Hijri Date night content follows once Maghrib has passed at the
 * Believer's location (the next day's); null before Maghrib, or without a
 * location. The date shown elsewhere stays the civil day's.
 */
export const useTonightHijriDate = (): HijriDate | null => {
  const view = usePrayerTimesView();
  const calendar = useHijriCalendar();
  const now = useNow(MINUTE_MS);
  if (!view?.settings) {
    return null;
  }
  const timeZone = locationTimeZone(view.settings.coordinates);
  const local = now.toZonedDateTimeISO(timeZone);
  const { maghrib } = calculatePrayerTimes(
    local.toPlainDate(),
    timeZone,
    view.settings
  );
  return isAfterMaghrib(local, maghrib)
    ? nightHijriDate(local, maghrib, calendar)
    : null;
};
