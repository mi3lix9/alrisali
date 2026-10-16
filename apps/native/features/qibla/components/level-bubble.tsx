import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useLevel } from "../hooks/use-level";
import { formatWholeNumber } from "../utils/format";

const CIRCLE = 56;
const BUBBLE = 16;
/** How far the bubble's centre can travel from the circle's centre. */
const TRAVEL = (CIRCLE - BUBBLE) / 2 - 4;

/**
 * A small bubble level for holding the phone flat: the bubble floats to the
 * high side and turns green when the phone is level. Renders nothing on a
 * device without an accelerometer.
 */
export const LevelBubble = () => {
  const { t } = useTranslation("qibla");
  const level = useLevel();

  if (!level) {
    return null;
  }

  const tilt = formatWholeNumber(Math.round(level.tilt));
  return (
    <View
      className="flex-row items-center gap-3"
      accessible
      accessibilityLabel={`${t("level.label")}: ${
        level.level ? t("level.level") : t("level.tilted")
      }, ${t("level.tilt", { degrees: tilt })}`}
      testID="qibla-level"
    >
      <View
        className="bg-muted items-center justify-center rounded-full"
        style={{ width: CIRCLE, height: CIRCLE }}
      >
        <View className="border-border absolute size-6 rounded-full border" />
        <View
          className={`absolute rounded-full ${
            level.level ? "bg-success" : "bg-warning"
          }`}
          style={{
            width: BUBBLE,
            height: BUBBLE,
            transform: [
              { translateX: level.bubble.x * TRAVEL },
              { translateY: -level.bubble.y * TRAVEL },
            ],
          }}
        />
      </View>
      <View className="flex-1">
        <Text weight="semibold">
          {level.level ? t("level.level") : t("level.tilted")}
        </Text>
        <Text size="sm" muted>
          {t("level.tilt", { degrees: tilt })}
        </Text>
      </View>
    </View>
  );
};
