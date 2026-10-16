import "../i18n";
import type { KhatmahSessionRow } from "@alrisali/domain/khatmah";
import { Item, Text } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Temporal } from "temporal-polyfill";

import { formatDateTime, formatNumber } from "@/shared/lib/numbers";

import { useAyahLabel } from "../utils/use-ayah-label";

const RELATIVE_DAYS = {
  "-1": "yesterday",
  "0": "today",
  "1": "tomorrow",
} as const;

/** "yesterday", "today", "tomorrow", else the short date: "3 Oct". */
const useWhen = (today: Temporal.PlainDate) => {
  const { t } = useTranslation("khatmah");
  return (date: Temporal.PlainDate): string => {
    const daysFromToday = today.until(date, { largestUnit: "days" }).days;
    const relative =
      RELATIVE_DAYS[String(daysFromToday) as keyof typeof RELATIVE_DAYS];
    return relative
      ? t(`sessions.relative.${relative}`)
      : formatDateTime(date, { day: "numeric", month: "short" });
  };
};

/** Every Khatmah Session with its portion, its date and whether it is done. */
export const SessionList = ({
  rows,
  today,
}: {
  rows: KhatmahSessionRow[];
  today: Temporal.PlainDate;
}) => {
  const { t } = useTranslation("khatmah");
  const ayahLabel = useAyahLabel();
  const when = useWhen(today);

  return (
    <View className="gap-2" testID="khatmah-sessions">
      {rows.map((row) => (
        <Item
          key={row.number}
          size="sm"
          variant="outline"
          testID={`khatmah-session-${row.number}`}
        >
          <Item.Content>
            <Item.Title>
              {t("sessions.session", { n: formatNumber(row.number) })}
            </Item.Title>
            <Item.Description>
              {t("status.portion", {
                from: ayahLabel(row.from),
                to: ayahLabel(row.to),
              })}
            </Item.Description>
            <Text
              size="xs"
              muted={row.state !== "missed"}
              className={row.state === "missed" ? "text-destructive" : ""}
            >
              {t(`sessions.${row.state}`)}
              {" · "}
              {when(row.doneOn ?? row.dueDate)}
            </Text>
          </Item.Content>
          {row.state === "done" ? (
            <Item.Actions>
              <CheckIcon size={18} />
            </Item.Actions>
          ) : null}
        </Item>
      ))}
    </View>
  );
};
