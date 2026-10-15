import { SURAHS } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/domain/quran";
import { findAyah } from "@alrisali/domain/quran";
import { Button, Spinner, Text } from "panelui-native";
import {
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
  RotateCwIcon,
  XIcon,
} from "panelui-native/icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import {
  sendRecitation,
  stopReaderRecitation,
  useRecitationPlayback,
} from "../data/recitation-player";
import { useReciters } from "../data/reciters";
import { formatNumber } from "../utils/format";
import { ReciterSheet, useReciterName } from "./reciter-sheet";

interface RecitationPillProps {
  /** The first ayah on screen: where Play starts. */
  start: AyahKey;
  reciterId: number;
  /** Whether the reader's controls show; the pill also stays while audio plays. */
  chromeVisible: boolean;
  /** Distance from the screen's bottom edge. */
  bottom: number;
  onReciterChange: (reciterId: number) => void;
  /** Keeps the controls up while the Believer uses the pill. */
  onInteract: () => void;
}

/**
 * The reader's floating recitation pill: play from the first ayah on screen,
 * pause, stop, and choose the reciter.
 */
export const RecitationPill = ({
  start,
  reciterId,
  chromeVisible,
  bottom,
  onReciterChange,
  onInteract,
}: RecitationPillProps) => {
  const { t, i18n } = useTranslation("quran");
  const playback = useRecitationPlayback();
  const reciters = useReciters();
  const nameOf = useReciterName();
  const [choosing, setChoosing] = useState(false);
  useEffect(() => stopReaderRecitation, []);

  // Home's Verse of the Day plays one ayah (`until`); the reader plays on.
  const active = playback.status !== "idle" && playback.until === null;
  if (!(chromeVisible || active || choosing)) {
    return null;
  }

  const press = (action: () => void) => () => {
    onInteract();
    action();
  };
  const playing = active ? findAyah(playback.ayah) : undefined;
  const surah = playing ? SURAHS[playing.surah - 1] : undefined;
  const reciter = reciters.data?.find((entry) => entry.id === reciterId);
  let label = t("recitation.label");
  if (playing && surah) {
    label = t("recitation.position", {
      surah: i18n.language === "ar" ? surah.nameAr : surah.nameEn,
      ayah: formatNumber(i18n.language, playing.ayah),
    });
  } else if (reciter) {
    label = nameOf(reciter);
  }

  const main = (() => {
    if (!active) {
      return {
        label: t("recitation.play"),
        icon: <PlayIcon size={20} />,
        handlePress: () =>
          sendRecitation({ type: "play", ayah: start, reciterId }),
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

  const selectReciter = (id: number) => {
    setChoosing(false);
    onReciterChange(id);
    if (active && id !== playback.reciterId) {
      sendRecitation({ type: "play", ayah: playback.ayah, reciterId: id });
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
          <Button
            size="icon"
            accessibilityLabel={main.label}
            onPress={press(main.handlePress)}
          >
            {main.icon}
          </Button>
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
              style={{ maxWidth: 200 }}
            >
              {label}
            </Text>
          </Button>
          {active ? (
            <Button
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
        reciterId={reciterId}
        onSelect={selectReciter}
        onClose={() => setChoosing(false)}
      />
    </>
  );
};
