import type { TimeFormat } from "@alrisali/domain/shared";
import { locationTimeZone } from "@alrisali/domain/shared";
import type { TimetablePlace } from "@alrisali/domain/timetable";
import { getCalendars } from "expo-localization";
import { useMemo } from "react";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { useHijriCalendar } from "@/shared/lib/hijri-calendar";

export interface TimetableView {
  place: TimetablePlace;
  placeName: string | null;
  timeFormat: TimeFormat;
}

/**
 * Where and how a timetable is worked out: the Believer's location on its
 * own clock, their Calculation Method and Hijri calendar. Undefined while it
 * loads, null until they have a location.
 */
export const useTimetablePlace = (): TimetableView | null | undefined => {
  const { data: believer } = useBelieverSettings();
  const calendar = useHijriCalendar();
  return useMemo(() => {
    if (!believer) {
      return;
    }
    const { location } = believer;
    if (!location) {
      return null;
    }
    const coordinates = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    return {
      place: {
        calendar,
        timeZone: locationTimeZone(coordinates),
        settings: {
          coordinates,
          calculationMethod: believer.calculationMethod,
          imsakMinutes: believer.imsakMinutes,
          customAngles: believer.customAngles,
        },
      },
      placeName: location.name ?? null,
      timeFormat:
        believer.timeFormat ??
        (getCalendars()[0]?.uses24hourClock === false ? "12h" : "24h"),
    };
  }, [believer, calendar]);
};
