import "../i18n";
import {
  lastQadaSalahLog,
  nextQadaSalahLog,
  qadaSalahCount,
  remainingBacklog,
} from "@alrisali/domain/qada";
import type { Salah } from "@alrisali/domain/shared";
import { Chip } from "panelui-native";
import { useTranslation } from "react-i18next";
import type { Temporal } from "temporal-polyfill";

import { formatNumber } from "@/shared/lib/numbers";

import { useChangeQadaLog, useQadaData } from "../data/qada";

/**
 * The Prayer Log's Qada tick beside a Salah: logs a Qada of that Salah on
 * `date` (the same record as ticking it on the Qada dashboard, so it counts
 * once), or un-ticks the last one. Hidden until a Qada Plan is set up, and
 * once nothing of that Salah is left to make up.
 */
export const QadaSalahToggle = ({
  date,
  salah,
}: {
  date: Temporal.PlainDate;
  salah: Salah;
}) => {
  const { t } = useTranslation("qada");
  const { data } = useQadaData();
  const { mutate: change } = useChangeQadaLog();

  if (!data?.plan) {
    return null;
  }
  const { plan, logs } = data;
  const count = qadaSalahCount(logs, date, salah);
  const left = remainingBacklog(plan.backlog, logs).salah[salah];
  if (count === 0 && left === 0) {
    return null;
  }

  const toggle = () => {
    const last = lastQadaSalahLog(logs, date, salah);
    if (last) {
      change({ log: last, logged: false });
    } else {
      change({ log: nextQadaSalahLog(logs, date, salah), logged: true });
    }
  };

  return (
    <Chip
      testID={`qada-prayer-log-${salah}`}
      selected={count > 0}
      haptics
      accessibilityLabel={t("prayerLog.label", {
        name: t(`salah.${salah}`),
      })}
      onPress={toggle}
    >
      {count > 1
        ? t("prayerLog.qadaCount", { times: formatNumber(count) })
        : t("prayerLog.qada")}
    </Chip>
  );
};
