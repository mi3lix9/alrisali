import { QIBLA_TARGET_IDS } from "@alrisali/domain/qibla";
import type { QiblaTarget } from "@alrisali/domain/qibla";
import { Chip } from "panelui-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

/** One chip per target, the Kaaba first; the chosen one is selected. */
export const TargetChips = ({
  target,
  onSelect,
}: {
  target: QiblaTarget;
  onSelect: (target: QiblaTarget) => void;
}) => {
  const { t } = useTranslation("qibla");
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t("targets.label")}
      contentContainerClassName="gap-2"
      className="grow-0"
    >
      {QIBLA_TARGET_IDS.map((id) => (
        <Chip
          key={id}
          size="lg"
          variant={id === target ? "primary" : "outline"}
          selected={id === target}
          onPress={() => onSelect(id)}
          testID={`qibla-target-${id}`}
        >
          {t(`targets.${id}`)}
        </Chip>
      ))}
    </ScrollView>
  );
};
