import "../i18n";
import { SCHOLAR_REVIEWED } from "@alrisali/content/quran";
import type { ByMeaningDays } from "@alrisali/content/quran";
import { Chip, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

const OPTIONS: readonly ByMeaningDays[] = [7, 29, 60];

/** The by-meaning plan's length, with a note while its division awaits scholar review. */
export const MeaningField = ({
  days,
  onChange,
}: {
  days: ByMeaningDays;
  onChange: (days: ByMeaningDays) => void;
}) => {
  const { t } = useTranslation("khatmah");
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <Chip
            key={option}
            size="lg"
            testID={`khatmah-meaning-${option}`}
            variant={option === days ? "primary" : "outline"}
            selected={option === days}
            onPress={() => onChange(option)}
          >
            {t("plan.meaning.option", { days: formatNumber(option) })}
          </Chip>
        ))}
      </View>
      {SCHOLAR_REVIEWED[days] ? null : (
        <Text size="sm" muted>
          {t("plan.meaning.review")}
        </Text>
      )}
    </View>
  );
};
