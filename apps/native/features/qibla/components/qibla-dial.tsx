import { qiblaOffset } from "@alrisali/domain/qibla";
import { Text } from "panelui-native";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const TURN_MS = 200;
/** Every 45° but north, which has its letter. */
const TICKS = [45, 90, 135, 180, 225, 270, 315] as const;

/**
 * Something fixed to the dial at a bearing: a full-size layer turned about the
 * centre, so it's symmetric and never mirrored in right-to-left layouts.
 */
const AtBearing = ({
  degrees,
  children,
}: {
  degrees: number;
  children: ReactNode;
}) => (
  <View
    className="absolute inset-0 items-center"
    style={{ transform: [{ rotate: `${degrees}deg` }] }}
  >
    {children}
  </View>
);

/**
 * A compass card that turns against the device heading, so north and the
 * Kaaba stay put in the world while the pointer at the top is where the
 * device points. Without a heading the card shows north up.
 */
export const QiblaDial = ({
  heading,
  bearing,
  facing,
}: {
  heading: number | null;
  bearing: number;
  facing: boolean;
}) => {
  const { t } = useTranslation("qibla");
  // Unwrapped (may pass 360) so 359° → 1° turns 2°, not back round.
  const turned = useSharedValue(heading ?? 0);

  useEffect(() => {
    const target = heading ?? 0;
    const current = turned.get();
    turned.set(
      withTiming(current + qiblaOffset(current, target), { duration: TURN_MS })
    );
  }, [heading, turned]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-turned.get()}deg` }],
  }));

  return (
    <View
      className="size-72 items-center justify-center self-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        className={`bg-card absolute inset-0 rounded-full border-4 ${
          facing ? "border-success" : "border-border"
        }`}
        style={cardStyle}
      >
        {TICKS.map((degrees) => (
          <AtBearing key={degrees} degrees={degrees}>
            <View className="bg-muted-foreground mt-2 h-3 w-0.5" />
          </AtBearing>
        ))}
        <AtBearing degrees={0}>
          <Text weight="bold" className="text-destructive mt-1">
            {t("north")}
          </Text>
        </AtBearing>
        <AtBearing degrees={bearing}>
          <View
            className={`mt-6 size-8 rounded-md border-2 ${
              facing
                ? "bg-success border-success"
                : "bg-foreground border-primary"
            }`}
          />
        </AtBearing>
        <AtBearing degrees={bearing}>
          <View className="bg-primary/40 mt-16 h-20 w-1 rounded-full" />
        </AtBearing>
      </Animated.View>
      {heading === null ? null : (
        <View className="absolute inset-0 items-center">
          <View
            className={`-mt-3 h-10 w-1.5 rounded-full ${
              facing ? "bg-success" : "bg-primary"
            }`}
          />
        </View>
      )}
      <View className="bg-muted size-3 rounded-full" />
    </View>
  );
};
