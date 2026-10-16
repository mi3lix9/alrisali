import "../i18n";
import { MOODS, remedyById } from "@alrisali/domain/mood";
import { Card, Chip, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { useCheckIn, useTodaysMoodCheckIn } from "../data/mood-check-ins";

/** Home's Mood Check-in: pick a mood, receive a Remedy for it. */
export const MoodCheckInCard = () => {
  const { t } = useTranslation("mood");
  const { data: today } = useTodaysMoodCheckIn();
  const { mutate: checkIn, isPending, isError } = useCheckIn();
  const remedy = today ? remedyById(today.remedyId) : null;

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>{t("description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          {MOODS.map((mood) => (
            <Chip
              key={mood}
              selected={today?.mood === mood}
              disabled={isPending}
              onPress={() => checkIn(mood)}
            >
              {t(`moods.${mood}`)}
            </Chip>
          ))}
        </View>
        {isError ? (
          <Text className="text-destructive">{t("saveError")}</Text>
        ) : null}
        {remedy ? (
          <View className="gap-1">
            <Text muted>{t("remedy")}</Text>
            <Text>{remedy.text[launchLanguage]}</Text>
            {remedy.source ? (
              <Text muted>{remedy.source[launchLanguage]}</Text>
            ) : null}
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
};
