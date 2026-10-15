import { completesAt, currentStep } from "@alrisali/domain/prayer-assistant";
import type {
  AssistantState,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { useKeepAwake } from "expo-keep-awake";
import { Button, Progress, Text } from "panelui-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, View } from "react-native";

const FINAL_HOLD_REDRAW_MS = 250;

// No Salah has more than four Rak'ahs.
const RAKAH_ORDINALS = ["first", "second", "third", "fourth"] as const;

/** How far through the final Tashahhud hold the Believer is, 0 to 1. */
const useFinalHoldProgress = (state: AssistantState): number | null => {
  const due = completesAt(state);
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (due === null) {
      return;
    }
    const timer = setInterval(
      () => setNow(performance.now()),
      FINAL_HOLD_REDRAW_MS
    );
    return () => clearInterval(timer);
  }, [due]);

  if (due === null) {
    return null;
  }
  const remaining = Math.max(0, due - now);
  return 1 - remaining / state.holds.finalTashahhudMs;
};

interface PrayingViewProps {
  state: AssistantState;
  send: (sighting: Sighting) => void;
  onStop: () => void;
}

/**
 * The Salah in progress: the Rak'ah and Position, read from a distance. A
 * tap anywhere moves to the next Position. The screen stays awake.
 */
export const PrayingView = ({ state, send, onStop }: PrayingViewProps) => {
  useKeepAwake();
  const { t } = useTranslation("prayer-assistant");
  const step = currentStep(state);
  const finalHold = useFinalHoldProgress(state);
  const position = step.final
    ? t("position.finalTashahhud")
    : t(`position.${step.position}`);
  const rakah = t(`rakah.${RAKAH_ORDINALS[step.rakah - 1] ?? "fourth"}`);

  const confirmStop = () =>
    Alert.alert(t("praying.stopTitle"), t("praying.stopMessage"), [
      { text: t("praying.stopCancel"), style: "cancel" },
      { text: t("praying.stopConfirm"), style: "destructive", onPress: onStop },
    ]);

  return (
    <View className="bg-background flex-1 gap-4 p-4">
      <Progress
        value={state.index + 1}
        minValue={0}
        maxValue={state.steps.length}
        accessibilityLabel={rakah}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("praying.tapToAdvance")}
        accessibilityHint={`${rakah}, ${position}`}
        className="border-border flex-1 items-center justify-center gap-4 rounded-3xl border"
        onPress={() => send({ kind: "advance" })}
      >
        <Text size="xl" muted>
          {rakah}
        </Text>
        <Text size="3xl" weight="bold" className="text-center">
          {position}
        </Text>
        {finalHold === null ? (
          <Text muted className="px-6 text-center">
            {t("praying.tapHint")}
          </Text>
        ) : (
          <View className="w-full gap-3 px-6">
            <Progress value={finalHold} minValue={0} maxValue={1} />
            <Text muted className="text-center">
              {t("praying.finalHint")}
            </Text>
          </View>
        )}
      </Pressable>
      <View className="flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          disabled={state.index === 0}
          onPress={() => send({ kind: "back" })}
        >
          {t("praying.back")}
        </Button>
        {step.final ? (
          <Button className="flex-1" onPress={() => send({ kind: "advance" })}>
            {t("praying.finish")}
          </Button>
        ) : (
          <Button variant="ghost" className="flex-1" onPress={confirmStop}>
            {t("praying.stop")}
          </Button>
        )}
      </View>
    </View>
  );
};
