import "../i18n";
import {
  COMPANION_THEMES,
  companionLevel,
  companionStage,
  XP_PER_LEVEL,
} from "@alrisali/domain/companion";
import type { CompanionStage } from "@alrisali/domain/companion";
import { Card, Chip, Progress, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useCompanion, useSetCompanionTheme } from "../data/companion";

/** Decorative: the stage is named in text beside it. */
const STAGE_EMOJI: Record<CompanionStage, string> = {
  seedling: "🌱",
  sprout: "🌿",
  bloom: "🌸",
  tree: "🌳",
  garden: "🏡",
  seeker: "🚶",
  wayfarer: "🧭",
  pilgrim: "⛺",
  guidingLight: "🌟",
  travellingSpirit: "✨",
};

/** Home's Companion: its stage, level and XP, and a choice of theme. */
export const CompanionCard = () => {
  const { t } = useTranslation("companion");
  const { data: companion } = useCompanion();
  const setTheme = useSetCompanionTheme();

  if (!companion) {
    return null;
  }
  const { level, xpIntoLevel, xpToNextLevel } = companionLevel(companion.xp);
  const stage = companionStage(companion.theme, level);

  return (
    <Card testID="companion-card">
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        <View className="flex-row items-center gap-4">
          <Text
            className="text-5xl"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {STAGE_EMOJI[stage]}
          </Text>
          <View className="flex-1 gap-2">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="font-semibold" testID="companion-stage">
                {t(`stages.${stage}`)}
              </Text>
              <Text muted testID="companion-level">
                {t("level", { level })}
              </Text>
            </View>
            <Progress
              accessibilityLabel={t("progressLabel")}
              value={xpIntoLevel}
              maxValue={XP_PER_LEVEL}
              size="sm"
            />
            <View className="flex-row justify-between gap-2">
              <Text muted testID="companion-xp">
                {t("xp", { xp: companion.xp })}
              </Text>
              <Text muted>{t("xpToNextLevel", { xp: xpToNextLevel })}</Text>
            </View>
          </View>
        </View>
        <Text muted>{t(`tips.${stage}`)}</Text>
        <View className="gap-2">
          <Text muted>{t("theme")}</Text>
          <View className="flex-row gap-2">
            {COMPANION_THEMES.map((theme) => (
              <Chip
                key={theme}
                selected={companion.theme === theme}
                disabled={setTheme.isPending}
                onPress={() => setTheme.mutate(theme)}
              >
                {t(`themes.${theme}`)}
              </Chip>
            ))}
          </View>
          {setTheme.isError ? (
            <Text className="text-destructive">{t("themeError")}</Text>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
};
