import { SURAHS } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/domain/quran";
import { findAyah, findReciter } from "@alrisali/domain/quran";
import { Button, Spinner, Text } from "panelui-native";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  PauseIcon,
  PlayIcon,
  RotateCwIcon,
  XIcon,
} from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { launchDirection } from "@/shared/lib/i18n";
import { formatNumber } from "@/shared/lib/numbers";

import {
  sendRecitation,
  useRecitationPlayback,
} from "../data/recitation-player";
import { ReciterSheet, useReciterName } from "./reciter-sheet";

interface RecitationPillProps {
  /** The first ayah on screen: where Play starts. */
  start: AyahKey;
  /** The bundled reciter's key. */
  reciter: string;
  /** Whether the reader's controls show; the pill also stays while audio plays. */
  chromeVisible: boolean;
  /** Distance from the screen's bottom edge. */
  bottom: number;
  onReciterChange: (reciter: string) => void;
  /** Opens Play To at the ayah reciting, to set where it stops. */
  onOptions: (ayah: AyahKey) => void;
  /** Keeps the controls up while the Believer uses the pill. */
  onInteract: () => void;
}

/**
 * The reader's mini player bar: play from the first ayah on screen; while
 * audio plays, the previous and next ayah, pause, options (Play To), stop,
 * and the reciter. It stays up, and playback goes on, when the reader closes.
 */
export const RecitationPill = ({
  start,
  reciter,
  chromeVisible,
  bottom,
  onReciterChange,
  onOptions,
  onInteract,
}: RecitationPillProps) => {
  const { t, i18n } = useTranslation("quran");
  const playback = useRecitationPlayback();
  const nameOf = useReciterName();
  const [choosing, setChoosing] = useState(false);
  // The arrows point the way the text runs: in Arabic, onward is leftward.
  const [PreviousIcon, NextIcon] =
    launchDirection === "rtl"
      ? [ChevronRightIcon, ChevronLeftIcon]
      : [ChevronLeftIcon, ChevronRightIcon];

  // Home's Verse of the Day plays on its own card, not on this bar.
  const active = playback.status !== "idle" && playback.origin === "reader";
  if (!(chromeVisible || active || choosing)) {
    return null;
  }

  const press = (action: () => void) => () => {
    onInteract();
    action();
  };
  const playing = active ? findAyah(playback.ayah) : undefined;
  const surah = playing ? SURAHS[playing.surah - 1] : undefined;
  const chosen = findReciter(reciter);
  let label = t("recitation.label");
  if (playing && surah) {
    label = t("recitation.position", {
      surah: i18n.language === "ar" ? surah.nameAr : surah.nameEn,
      ayah: formatNumber(playing.ayah),
    });
  } else if (chosen) {
    label = nameOf(chosen);
  }

  const main = (() => {
    if (!active) {
      return {
        label: t("recitation.play"),
        icon: <PlayIcon size={20} />,
        handlePress: () =>
          sendRecitation({ type: "play", ayah: start, reciter }),
      };
    }
    switch (playback.status) {
      case "loading": {
        return {
          label: t("recitation.pause"),
          icon: <Spinner size="sm" />,
          handlePress: () => sendRecitation({ type: "pause" }),
        };
      }
      case "playing": {
        return {
          label: t("recitation.pause"),
          icon: <PauseIcon size={20} />,
          handlePress: () => sendRecitation({ type: "pause" }),
        };
      }
      case "paused": {
        return {
          label: t("recitation.resume"),
          icon: <PlayIcon size={20} />,
          handlePress: () => sendRecitation({ type: "resume" }),
        };
      }
      default: {
        return {
          label: t("recitation.retry"),
          icon: <RotateCwIcon size={20} />,
          handlePress: () => sendRecitation({ type: "resume" }),
        };
      }
    }
  })();

  const selectReciter = (key: string) => {
    setChoosing(false);
    onReciterChange(key);
    if (active && key !== playback.reciter) {
      sendRecitation({ type: "reciter", reciter: key });
    }
  };

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
        pointerEvents="box-none"
        style={{ bottom }}
        className="absolute inset-x-0 items-center"
      >
        <View
          accessibilityRole="toolbar"
          accessibilityLabel={t("recitation.label")}
          className="bg-popover border-border flex-row items-center gap-1 rounded-full border p-1 shadow-lg"
        >
          {active ? (
            <Button
              testID="recitation-previous"
              variant="ghost"
              size="icon"
              accessibilityLabel={t("recitation.previousAyah")}
              onPress={press(() =>
                sendRecitation({ type: "skip", direction: "previous" })
              )}
            >
              <PreviousIcon size={20} />
            </Button>
          ) : null}
          <Button
            testID="recitation-main"
            size="icon"
            accessibilityLabel={main.label}
            onPress={press(main.handlePress)}
          >
            {main.icon}
          </Button>
          {active ? (
            <Button
              testID="recitation-next"
              variant="ghost"
              size="icon"
              accessibilityLabel={t("recitation.nextAyah")}
              onPress={press(() =>
                sendRecitation({ type: "skip", direction: "next" })
              )}
            >
              <NextIcon size={20} />
            </Button>
          ) : null}
          {active ? (
            <Button
              testID="recitation-options"
              variant="ghost"
              size="icon"
              accessibilityLabel={t("recitation.options")}
              onPress={press(() => onOptions(playback.ayah))}
            >
              <EllipsisIcon size={20} />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            accessibilityLabel={t("recitation.chooseReciter")}
            endContent={<ChevronDownIcon size={16} />}
            onPress={press(() => setChoosing(true))}
          >
            <Text
              size="sm"
              numberOfLines={1}
              accessibilityLiveRegion="polite"
              style={{ maxWidth: active ? 120 : 200 }}
            >
              {label}
            </Text>
          </Button>
          {active ? (
            <Button
              testID="recitation-stop"
              variant="ghost"
              size="icon"
              accessibilityLabel={t("recitation.stop")}
              onPress={press(() => sendRecitation({ type: "stop" }))}
            >
              <XIcon size={18} />
            </Button>
          ) : null}
        </View>
        {playback.status === "error" && active ? (
          <Text size="xs" className="text-destructive mt-1">
            {t("recitation.failed")}
          </Text>
        ) : null}
      </Animated.View>
      <ReciterSheet
        open={choosing}
        reciter={reciter}
        onSelect={selectReciter}
        onClose={() => setChoosing(false)}
      />
    </>
  );
};
