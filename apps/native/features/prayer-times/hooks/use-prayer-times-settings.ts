import type {
  PrayerTimeName,
  PrayerTimesSettings,
  TimeFormat,
} from "@alrisali/domain/shared";

import { useBelieverSettings } from "@/shared/lib/believer-settings";

import { useHiddenPrayerTimes } from "../data/hidden-prayer-times";
import { effectiveTimeFormat } from "../utils/format";

export interface PrayerTimesView {
  /** Null until the Believer has a location. */
  settings: PrayerTimesSettings | null;
  hidden: readonly PrayerTimeName[];
  timeFormat: TimeFormat;
}

/**
 * Everything the timetable and the countdown are computed from, or undefined
 * while it loads. Saving a setting refreshes it, so times follow at once.
 */
export const usePrayerTimesView = (): PrayerTimesView | undefined => {
  const { data: believer } = useBelieverSettings();
  const { data: hidden } = useHiddenPrayerTimes();
  if (!believer || !hidden) {
    return undefined;
  }
  const {
    location,
    calculationMethod,
    customAngles,
    imsakMinutes,
    prayerAdjustments,
    midnightDefinition,
    highLatitudeRule,
    timeFormat,
  } = believer;
  return {
    settings: location
      ? {
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          calculationMethod,
          imsakMinutes,
          customAngles,
          adjustments: prayerAdjustments,
          midnight: midnightDefinition,
          highLatitudeRule,
        }
      : null,
    hidden,
    timeFormat: effectiveTimeFormat(timeFormat),
  };
};
