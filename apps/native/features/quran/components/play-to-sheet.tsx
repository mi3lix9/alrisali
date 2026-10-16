import {
  ayatOfSurah,
  findAyah,
  isPlayToReachable,
  PLAY_TO_KINDS,
  playToEnd,
  SURAH_COUNT,
} from "@alrisali/domain/quran";
import type { AyahKey, PlayTo } from "@alrisali/domain/quran";
import {
  BottomSheet,
  Button,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { MinusIcon, PlusIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { sendRecitation } from "../data/recitation-player";
import { playFromAyah } from "../utils/ayah-actions";
import { surahName } from "../utils/format";

type PlayToKind = (typeof PLAY_TO_KINDS)[number];

interface StepperProps {
  label: string;
  value: string;
  previousLabel: string;
  nextLabel: string;
  testID: string;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
}

const Stepper = ({
  label,
  value,
  previousLabel,
  nextLabel,
  testID,
  onPrevious,
  onNext,
}: StepperProps) => (
  <View className="flex-row items-center justify-between gap-2">
    <Text size="sm" muted>
      {label}
    </Text>
    <View className="flex-row items-center gap-2">
      <Button
        testID={`${testID}-previous`}
        variant="outline"
        size="icon"
        accessibilityLabel={previousLabel}
        disabled={!onPrevious}
        onPress={onPrevious}
      >
        <MinusIcon size={18} />
      </Button>
      <Text weight="semibold" style={{ minWidth: 96, textAlign: "center" }}>
        {value}
      </Text>
      <Button
        testID={`${testID}-next`}
        variant="outline"
        size="icon"
        accessibilityLabel={nextLabel}
        disabled={!onNext}
        onPress={onNext}
      >
        <PlusIcon size={18} />
      </Button>
    </View>
  </View>
);

interface PlayToFormProps {
  from: AyahKey;
  reciter: string;
  onStart: () => void;
}

const PlayToForm = ({ from, reciter, onStart }: PlayToFormProps) => {
  const { t, i18n } = useTranslation("quran");
  const start = findAyah(from);
  const [kind, setKind] = useState<PlayToKind>("page");
  const [chosen, setChosen] = useState({
    surah: start?.surah ?? 1,
    ayah: start?.ayah ?? 1,
  });
  if (!start) {
    return null;
  }

  const chosenKey: AyahKey = `${chosen.surah}:${chosen.ayah}`;
  const to: PlayTo =
    kind === "ayah" ? { kind, ayah: chosenKey } : ({ kind } as PlayTo);
  const reachable = isPlayToReachable(from, to);
  const end = reachable ? playToEnd(from, to) : null;
  const endAyah = end ? findAyah(end) : undefined;

  const label = (key: AyahKey | undefined) => {
    const ayah = key ? findAyah(key) : undefined;
    return ayah
      ? t("playTo.range", {
          surah: surahName(i18n.language, ayah.surah),
          ayah: formatNumber(ayah.ayah),
        })
      : "";
  };

  const moveSurah = (step: -1 | 1) =>
    setChosen({ surah: chosen.surah + step, ayah: 1 });
  const moveAyah = (step: -1 | 1) =>
    setChosen({ ...chosen, ayah: chosen.ayah + step });
  const surahLength = ayatOfSurah(chosen.surah).length;

  return (
    <View className="gap-4">
      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text size="sm" muted>
            {t("playTo.from")}
          </Text>
          <Text weight="semibold">{label(from)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text size="sm" muted>
            {t("playTo.to")}
          </Text>
          <Text weight="semibold" testID="play-to-end">
            {label(end ?? undefined)}
          </Text>
        </View>
      </View>
      <ToggleButtonGroup
        selectionMode="single"
        size="sm"
        accessibilityLabel={t("playTo.ends")}
        value={[kind]}
        onValueChange={([next]) => {
          const selected = PLAY_TO_KINDS.find(
            (candidate) => candidate === next
          );
          if (selected) {
            setKind(selected);
          }
        }}
      >
        {PLAY_TO_KINDS.map((option) => (
          <ToggleButton key={option} id={option} testID={`play-to-${option}`}>
            {t(`playTo.${option}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {kind === "ayah" ? (
        <View className="gap-3">
          <Stepper
            testID="play-to-surah"
            label={t("playTo.surahField")}
            value={surahName(i18n.language, chosen.surah)}
            previousLabel={t("playTo.previousSurah")}
            nextLabel={t("playTo.nextSurah")}
            onPrevious={chosen.surah > 1 ? () => moveSurah(-1) : undefined}
            onNext={chosen.surah < SURAH_COUNT ? () => moveSurah(1) : undefined}
          />
          <Stepper
            testID="play-to-ayah"
            label={t("playTo.ayahField")}
            value={formatNumber(chosen.ayah)}
            previousLabel={t("playTo.previousAyah")}
            nextLabel={t("playTo.nextAyah")}
            onPrevious={chosen.ayah > 1 ? () => moveAyah(-1) : undefined}
            onNext={chosen.ayah < surahLength ? () => moveAyah(1) : undefined}
          />
          {reachable ? null : (
            <Text size="sm" className="text-destructive">
              {t("playTo.unreachable")}
            </Text>
          )}
        </View>
      ) : null}
      <Button
        testID="play-to-start"
        disabled={!reachable || endAyah === undefined}
        onPress={() => {
          sendRecitation(playFromAyah(from, reciter, to));
          onStart();
        }}
      >
        {t("playTo.start")}
      </Button>
    </View>
  );
};

interface PlayToSheetProps {
  /** The ayah recitation starts at; the sheet shows while it is set. */
  ayah: AyahKey | null;
  reciter: string;
  onClose: () => void;
}

/**
 * Play To: recitation from an ayah up to the end of its page, surah or juz, or
 * a chosen ayah.
 */
export const PlayToSheet = ({ ayah, reciter, onClose }: PlayToSheetProps) => {
  const { t } = useTranslation("quran");

  return (
    <BottomSheet
      open={ayah !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header title={t("playTo.title")} />
        <BottomSheet.Body className="pb-6">
          {/* Mounted per opening, so the form starts at the ayah it opened on. */}
          {ayah ? (
            <PlayToForm from={ayah} reciter={reciter} onStart={onClose} />
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
