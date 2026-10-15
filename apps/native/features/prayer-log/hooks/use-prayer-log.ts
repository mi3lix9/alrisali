import { prayerStreak } from "@alrisali/domain/prayer-log";
import type { PrayerLog } from "@alrisali/domain/prayer-log";
import type { Salah } from "@alrisali/domain/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

import { usePrayerLogs, useSetSalahPerformed } from "../data/prayer-logs";

const MINUTE_MS = 60_000;

/**
 * The device's local date, checked every minute and on return to the
 * foreground, so midnight starts a new day without a relaunch.
 */
export const useToday = (): Temporal.PlainDate => {
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

  return today;
};

export interface PrayerLogView {
  log: PrayerLog;
  /** The Prayer Streak ending today. */
  streak: number;
  /** Ticks at once; un-ticking asks the Believer to confirm first. */
  toggle: (salah: Salah) => void;
  /** The last change could not be saved (and was undone). */
  saveFailed: boolean;
}

/** One date's Prayer Log, the Prayer Streak, and the tick action; null while loading. */
export const usePrayerLog = (
  date: Temporal.PlainDate,
  today: Temporal.PlainDate
): PrayerLogView | null => {
  const { t } = useTranslation("prayer-log");
  const { data: logs } = usePrayerLogs();
  const { mutate: setPerformed, isError } = useSetSalahPerformed();

  if (!logs) {
    return null;
  }

  const log = logs.find((candidate) => candidate.date.equals(date)) ?? {
    date,
    performed: [],
  };

  const toggle = (salah: Salah) => {
    if (!log.performed.includes(salah)) {
      setPerformed({ date, salah, performed: true });
      return;
    }
    const name = t(`salah.${salah}`);
    Alert.alert(t("untick.title", { name }), t("untick.message", { name }), [
      { text: t("untick.cancel"), style: "cancel" },
      {
        text: t("untick.confirm"),
        style: "destructive",
        onPress: () => setPerformed({ date, salah, performed: false }),
      },
    ]);
  };

  return {
    log,
    streak: prayerStreak(logs, today),
    toggle,
    saveFailed: isError,
  };
};
