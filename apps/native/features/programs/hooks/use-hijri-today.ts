import type { HijriDate } from "@alrisali/domain/shared";
import { useMemo } from "react";

import { useHijriCalendar } from "@/shared/lib/hijri-calendar";
import { useToday } from "@/shared/lib/today";

/**
 * Today's Hijri Date, with the Hijri Adjustments applied; it moves on at
 * midnight without a relaunch, so a season opens on time.
 */
export const useHijriToday = (): HijriDate => {
  const calendar = useHijriCalendar();
  const today = useToday();
  return useMemo(() => calendar.toHijri(today), [calendar, today]);
};
