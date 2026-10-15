import "../i18n";
import { TASBIH_AL_ZAHRA_STEPS } from "@alrisali/domain/tasbih";
import type {
  TasbihAlZahraDhikr,
  TasbihAlZahraProgress,
} from "@alrisali/domain/tasbih";
import { Button, Direction, Progress, Spinner, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { useTasbihAlZahra } from "../hooks/use-tasbih-al-zahra";

/** Each step's dhikr as recited, in Arabic whatever the app language. */
const RECITATION: Record<TasbihAlZahraDhikr, string> = {
  "allahu-akbar": "ٱللَّٰهُ أَكْبَرُ",
  alhamdulillah: "ٱلْحَمْدُ لِلَّٰهِ",
  subhanallah: "سُبْحَانَ ٱللَّٰهِ",
};

const format = (value: number): string => value.toLocaleString(launchLanguage);

const StepDots = ({ step }: { step: number }) => (
  <View className="flex-row gap-1">
    {TASBIH_AL_ZAHRA_STEPS.map(({ dhikr }, index) => (
      <View
        key={dhikr}
        className={
          index === step
            ? "bg-primary h-1.5 w-8 rounded-full"
            : "bg-muted h-1.5 w-2 rounded-full"
        }
      />
    ))}
  </View>
);

const Counter = ({
  progress,
  roundCompleted,
  onTap,
  onReset,
}: {
  progress: TasbihAlZahraProgress;
  roundCompleted: boolean;
  onTap: () => void;
  onReset: () => void;
}) => {
  const { t } = useTranslation("tasbih");
  const { dhikr, target } =
    TASBIH_AL_ZAHRA_STEPS[progress.step] ?? TASBIH_AL_ZAHRA_STEPS[0];
  const counted = t("counter.progress", {
    count: format(progress.count),
    target: format(target),
  });

  return (
    <View className="flex-1 items-center justify-center gap-8 p-6">
      <View className="items-center gap-2">
        <Direction dir="rtl">
          <Text size="3xl" weight="semibold" className="text-primary">
            {RECITATION[dhikr]}
          </Text>
        </Direction>
        {launchLanguage === "ar" ? null : (
          <Text size="lg">{t(`dhikr.${dhikr}`)}</Text>
        )}
        <StepDots step={progress.step} />
      </View>

      <Pressable
        onPressIn={onTap}
        accessibilityRole="button"
        accessibilityLabel={t("counter.label")}
        accessibilityHint={t("counter.hint")}
        accessibilityValue={{ text: counted }}
        className="bg-card border-border size-64 items-center justify-center rounded-full border-4 active:opacity-80"
      >
        <Text className="text-7xl font-bold tabular-nums">
          {format(progress.count)}
        </Text>
        <Text muted>/ {format(target)}</Text>
      </Pressable>

      <View className="w-full max-w-72 gap-2">
        <Progress value={progress.count} maxValue={target} />
        <Text muted size="sm" className="text-center">
          {t("counter.step", {
            step: format(progress.step + 1),
            steps: format(TASBIH_AL_ZAHRA_STEPS.length),
          })}
        </Text>
      </View>

      <Text
        accessibilityLiveRegion="polite"
        className="text-success min-h-6 text-center"
      >
        {roundCompleted ? t("roundCompleted") : ""}
      </Text>

      <Button variant="outline" onPress={onReset}>
        {t("reset.action")}
      </Button>
    </View>
  );
};

/** The Tasbih tab: Tasbih al-Zahra, always first. */
export const TasbihScreen = () => {
  const { t } = useTranslation("tasbih");
  const { progress, roundCompleted, tap, reset } = useTasbihAlZahra();

  const confirmReset = () =>
    Alert.alert(t("reset.title"), t("reset.message"), [
      { text: t("reset.cancel"), style: "cancel" },
      { text: t("reset.confirm"), style: "destructive", onPress: reset },
    ]);

  return (
    <View className="bg-background flex-1">
      {progress ? (
        <Counter
          progress={progress}
          roundCompleted={roundCompleted}
          onTap={tap}
          onReset={confirmReset}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      )}
    </View>
  );
};
