import type { AyahKey, RecitationPlayback } from "@alrisali/domain/quran";
import type { TFunction } from "i18next";
import { Spinner } from "panelui-native";
import { PauseIcon, PlayIcon, RotateCwIcon } from "panelui-native/icons";
import type { ReactNode } from "react";

import { sendRecitation } from "../data/recitation-player";

interface MainControlOptions {
  playback: RecitationPlayback;
  /** Whether the reader's own recitation is on. */
  active: boolean;
  /** The first ayah on screen: where Play starts. */
  start: AyahKey;
  reciter: string;
  t: TFunction<"quran">;
}

interface MainControl {
  label: string;
  icon: ReactNode;
  handlePress: () => void;
}

/** The mini player bar's main button: play, pause, resume, continue or retry. */
export const mainControl = ({
  playback,
  active,
  start,
  reciter,
  t,
}: MainControlOptions): MainControl => {
  if (!active) {
    return {
      label: t("recitation.play"),
      icon: <PlayIcon size={20} />,
      handlePress: () => sendRecitation({ type: "play", ayah: start, reciter }),
    };
  }
  switch (playback.status) {
    case "awaiting-continue": {
      return {
        label: t("recitation.continueYes"),
        icon: <PlayIcon size={20} />,
        handlePress: () => sendRecitation({ type: "continue" }),
      };
    }
    case "loading":
    case "pausing": {
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
};
