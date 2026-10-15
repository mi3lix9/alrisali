import { RECITE_MODES, RECITE_PACES } from "@alrisali/domain/recite-along";
import type {
  ReciteEvent,
  ReciteProgress,
} from "@alrisali/domain/recite-along";
import { Button, Text, ToggleButton, ToggleButtonGroup } from "panelui-native";
import { PauseIcon, PlayIcon, RotateCcwIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRecitePreferences } from "../hooks/use-recite-preferences";
import type { VoiceSupport } from "../hooks/use-voice";
import { VoiceNotice } from "./voice-notice";

const hintKey = ({ mode, paused }: ReciteProgress, voice: VoiceSupport) => {
  switch (mode) {
    case "hold": {
      return "hint.hold";
    }
    case "auto": {
      return paused ? "hint.paused" : "hint.auto";
    }
    default: {
      if (paused) {
        return "hint.listeningPaused";
      }
      if (!voice.support) {
        return "hint.preparing";
      }
      return mode === "voice" ? "hint.voice" : "hint.hybrid";
    }
  }
};

/**
 * Method, pace, pause and restart, pinned under the text so they are in reach
 * at any scroll depth without losing the Believer's place. `progress.mode` is
 * the method in effect: a voice method falls back to holding without speech.
 */
export const ReciteControls = ({
  progress,
  dispatch,
  voice,
}: {
  progress: ReciteProgress;
  dispatch: (event: ReciteEvent) => void;
  voice: VoiceSupport;
}) => {
  const { t } = useTranslation("recite-along");
  const { mode, pace, setMode, setPace } = useRecitePreferences();
  const done = progress.total > 0 && progress.count >= progress.total;

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="border-border bg-background gap-3 border-t px-4 pt-3"
    >
      <VoiceNotice voice={voice} />
      <View className="flex-row items-center justify-between gap-2">
        <Text muted={!done} size="sm" className="flex-1">
          {done ? t("done") : t(hintKey(progress, voice))}
        </Text>
        <Text size="sm" style={{ fontVariant: ["tabular-nums"] }}>
          {t("progress", { count: progress.count, total: progress.total })}
        </Text>
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <ToggleButtonGroup
          selectionMode="single"
          size="sm"
          accessibilityLabel={t("mode.label")}
          value={[mode]}
          onValueChange={([next]) => {
            const selected = RECITE_MODES.find((option) => option === next);
            if (selected) {
              setMode(selected);
            }
          }}
        >
          {RECITE_MODES.map((option) => (
            <ToggleButton key={option} id={option}>
              {t(`mode.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {progress.mode === "voice" ? null : (
          <ToggleButtonGroup
            selectionMode="single"
            size="sm"
            accessibilityLabel={t("pace.label")}
            value={[pace]}
            onValueChange={([next]) => {
              const selected = RECITE_PACES.find((option) => option === next);
              if (selected) {
                setPace(selected);
              }
            }}
          >
            {RECITE_PACES.map((option) => (
              <ToggleButton key={option} id={option}>
                {t(`pace.${option}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </View>
      <View className="flex-row justify-between gap-2 pb-3">
        {progress.mode !== "hold" && !done ? (
          <Button
            size="sm"
            variant={progress.paused ? "primary" : "secondary"}
            onPress={() => dispatch({ type: "togglePause" })}
          >
            {progress.paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
            {progress.paused ? t("resume") : t("pause")}
          </Button>
        ) : (
          <View />
        )}
        {progress.count > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => dispatch({ type: "restart" })}
          >
            <RotateCcwIcon size={16} />
            {t("restart")}
          </Button>
        ) : null}
      </View>
    </SafeAreaView>
  );
};
