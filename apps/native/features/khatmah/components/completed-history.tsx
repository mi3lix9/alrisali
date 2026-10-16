import "../i18n";
import { khatmahDoneSessions, khatmahSessions } from "@alrisali/domain/khatmah";
import { router } from "expo-router";
import { Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { formatDateTime, formatNumber } from "@/shared/lib/numbers";

import { useKhatmahData } from "../data/khatmah";

/** The Believer's finished Khatmahs, the latest first; each opens its celebration. */
export const CompletedHistory = () => {
  const { t } = useTranslation("khatmahProgress");
  const { data } = useKhatmahData();

  const finished = (data?.khatmahs ?? []).flatMap((khatmah) => {
    const sessions = khatmahSessions(khatmah, data?.logs ?? []);
    const done = khatmahDoneSessions(khatmah, data?.logs ?? []);
    const last = (data?.logs ?? [])
      .filter(({ khatmahId }) => khatmahId === khatmah.id)
      .map(({ date }) => date)
      .toSorted(Temporal.PlainDate.compare)
      .at(-1);
    return done.size === sessions.length && last ? [{ khatmah, last }] : [];
  });
  if (finished.length === 0) {
    return null;
  }

  return (
    <View className="gap-2" testID="khatmah-history">
      <Text weight="semibold">{t("history.title")}</Text>
      {finished.toReversed().map(({ khatmah, last }) => (
        <Item
          key={khatmah.id}
          size="sm"
          variant="outline"
          onPress={() =>
            router.push({ pathname: "/khatmah", params: { id: khatmah.id } })
          }
        >
          <Item.Content>
            <Item.Title>
              {t("history.entry", {
                date: formatDateTime(last, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                days: formatNumber(
                  khatmah.startDate.until(last, { largestUnit: "days" }).days +
                    1
                ),
              })}
            </Item.Title>
          </Item.Content>
        </Item>
      ))}
    </View>
  );
};
