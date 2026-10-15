import "../i18n";
import type {
  Act,
  OfficialProgram,
  ProgramAvailability,
} from "@alrisali/domain/programs";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriMonthDay,
} from "@/shared/lib/hijri-calendar";
import { launchLanguage } from "@/shared/lib/preferences";

// 2024-01-01 was a Monday, Temporal's weekday 1.
const A_MONDAY = Temporal.PlainDate.from("2024-01-01");

/** Short lines describing a Program's season and an Act's timing. */
export const useDescribe = () => {
  const { t } = useTranslation("programs");
  const formatMonthDay = useFormatHijriMonthDay();

  const season = useCallback(
    (program: ProgramAvailability): string | null =>
      program.category === "seasonal"
        ? t("window", {
            start: formatMonthDay(program.window.start),
            end: formatMonthDay(program.window.end),
          })
        : null,
    [formatMonthDay, t]
  );

  const schedule = useCallback(
    ({ schedule: when }: Act): string => {
      switch (when.kind) {
        case "daily": {
          return t("schedule.daily");
        }
        case "weekdays": {
          const days = when.weekdays
            .map((weekday) =>
              formatGregorianDate(A_MONDAY.add({ days: weekday - 1 }), {
                weekday: "long",
              })
            )
            .join(launchLanguage === "ar" ? "، " : ", ");
          return t("schedule.weekdays", { days });
        }
        default: {
          return t("schedule.once", {
            date: formatGregorianDate(Temporal.PlainDate.from(when.date)),
          });
        }
      }
    },
    [t]
  );

  const timing = useCallback(
    ({ salah }: Act): string | null =>
      salah
        ? t(`salah.${salah.timing}`, {
            salah: t(`salahNames.${salah.salah}`),
          })
        : null,
    [t]
  );

  const actCount = useCallback(
    ({ acts }: Pick<OfficialProgram, "acts">) =>
      t("acts", { count: acts.length }),
    [t]
  );

  return { season, schedule, timing, actCount };
};
