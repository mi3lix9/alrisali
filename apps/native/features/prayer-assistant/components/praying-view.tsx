import {
  completesAt,
  HASTE_WARNING_MS,
  stepPlace,
} from "@alrisali/domain/prayer-assistant";
import type {
  AssistantState,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { useKeepAwake } from "expo-keep-awake";
import { Button, Progress, Text } from "panelui-native";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, View } from "react-native";

const FINAL_HOLD_REDRAW_MS = 250;

// Every prayer is prayed in segments of at most four Rak'ahs.
const RAKAH_ORDINALS = ["first", "second", "third", "fourth"] as const;
const MS_PER_SECOND = 1000;

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
  /** What the Recognition Mode's sensor is doing, above the Position. */
  notice?: ReactNode;
}

/**
 * The Salah in progress: the Rak'ah and Position, read from a distance. A
 * tap anywhere moves to the next Position. The screen stays awake.
 */
export const PrayingView = ({
  state,
  send,
  onStop,
  notice,
}: PrayingViewProps) => {
  useKeepAwake();
  const { t } = useTranslation("prayer-assistant");
  const place = stepPlace(state);
  const { step } = place;
  const finalHold = useFinalHoldProgress(state);
  const posture = step.final
    ? t("position.finalTashahhud")
    : t(`position.${step.position}`);
  const position = place.ruku
    ? t("praying.rukuOf", { position: posture, ...place.ruku })
    : posture;
  const ordinal = RAKAH_ORDINALS[place.rakah - 1];
  const rakah = ordinal
    ? t(`rakah.${ordinal}`)
    : t("rakah.numbered", { value: place.rakah });
  const prayer =
    place.segments > 1
      ? t("praying.segmentOf", {
          name: place.part
            ? t(`part.${place.part}`)
            : t(`salah.${state.definition.type}`),
          segment: place.segment,
          segments: place.segments,
        })
      : null;

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
      {notice}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("praying.tapToAdvance")}
        accessibilityHint={`${rakah}, ${position}`}
        className="border-border flex-1 items-center justify-center gap-4 rounded-3xl border"
        onPress={() => send({ kind: "advance" })}
      >
        {prayer ? <Text muted>{prayer}</Text> : null}
        <Text size="xl" muted>
          {rakah}
        </Text>
        {place.seated ? <Text muted>{t("praying.seated")}</Text> : null}
        <Text size="3xl" weight="bold" className="text-center">
          {position}
        </Text>
        {state.hasty ? (
          <Text className="text-warning px-6 text-center">
            {t("praying.haste", { value: HASTE_WARNING_MS / MS_PER_SECOND })}
          </Text>
        ) : null}
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
