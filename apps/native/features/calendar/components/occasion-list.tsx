import type { Occasion } from "@alrisali/domain/shared";
import { Badge, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { OCCASION_STYLE } from "../utils/occasion-style";

/** Occasions with their type, colour-coded; `empty` shows when there are none. */
export const OccasionList = ({
  occasions,
  empty,
}: {
  occasions: readonly Occasion[];
  empty: string;
}) => {
  const { t } = useTranslation("calendar");

  if (occasions.length === 0) {
    return <Text muted>{empty}</Text>;
  }

  return (
    <View className="gap-3">
      {occasions.map((occasion) => (
        <View key={occasion.id} className="items-start gap-1">
          <Text weight="medium">{occasion.name[launchLanguage]}</Text>
          <Badge size="sm" variant={OCCASION_STYLE[occasion.type].badge}>
            {t(`occasionTypes.${occasion.type}`)}
          </Badge>
        </View>
      ))}
    </View>
  );
};
