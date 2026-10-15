import type { HijriDate } from "@alrisali/domain/shared";
import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

import { useHijriCalendar } from "@/shared/lib/hijri-calendar";

const MINUTE_MS = 60_000;

/**
 * Today's Hijri Date, with the Hijri Adjustments applied; checked every
 * minute and on return to the foreground, so a season opens at midnight
 * without a relaunch.
 */
export const useHijriToday = (): HijriDate => {
  const calendar = useHijriCalendar();
  const [today, setToday] = useState(() => Temporal.Now.plainDateISO());

  useEffect(() => {
    const check = () =>
      setToday((shown) => {
        const now = Temporal.Now.plainDateISO();
        return now.equals(shown) ? shown : now;
      });
    const timer = setInterval(check, MINUTE_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        check();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return useMemo(() => calendar.toHijri(today), [calendar, today]);
};
