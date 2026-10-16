import "../i18n/duas";
import {
  RECITATION_DUA_MOMENTS,
  RECITATION_DUAS,
} from "@alrisali/domain/quran";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

import { DuaCard } from "../components/dua-card";

/**
 * The ayat to recite when reciting the Quran: before it, after it, and on
 * completing it, each with its recitation. The reader's menu and the
 * Khatmah's completion lead here.
 */
export const RecitationDuasScreen = () => {
  const { t } = useTranslation("quranDuas");
  // The moment to start at (`?moment=`); the others stay below it.
  const { moment: param } = useLocalSearchParams<{ moment?: string }>();
  const moment = RECITATION_DUA_MOMENTS.find((entry) => entry === param);
  const moments = moment
    ? [moment, ...RECITATION_DUA_MOMENTS.filter((other) => other !== moment)]
    : RECITATION_DUA_MOMENTS;

  return (
    <>
      <Stack.Screen options={{ title: t("recitation.title") }} />
      <ScrollView
        testID="recitation-duas"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <Text size="sm" muted>
          {t("recitation.description")}
        </Text>
        {moments.map((entry) => (
          <View
            key={entry}
            className="gap-3"
            testID={`recitation-dua-${entry}`}
          >
            <Text weight="semibold">{t(`recitation.moments.${entry}`)}</Text>
            {RECITATION_DUAS[entry].map((range) => (
              <DuaCard key={range.id} dua={range} />
            ))}
          </View>
        ))}
        <Button variant="outline" onPress={() => router.push("/quranic-duas")}>
          {t("recitation.quranicDuas")}
        </Button>
      </ScrollView>
    </>
  );
};
