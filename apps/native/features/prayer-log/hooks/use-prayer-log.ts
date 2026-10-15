import type { PrayerLog } from "@alrisali/domain/prayer-log";
import { prayerStreak } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type { Temporal } from "temporal-polyfill";

import { usePrayerLogs, useSetSalahPerformed } from "../data/prayer-logs";

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
