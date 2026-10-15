import { resumePosition } from "@alrisali/domain/library-assets";
import type { LibraryAsset } from "@alrisali/domain/library-assets";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { Button, Slider, Text } from "panelui-native";
import {
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
} from "panelui-native/icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { libraryFileUrl } from "../data/library-assets";
import { usePositionSaver } from "../hooks/use-position-saver";
import { formatDuration } from "../utils/format-duration";
import { CoverImage } from "./cover-image";

const SKIP_SECONDS = 15;
const STATUS_INTERVAL_MS = 500;

/**
 * An audio Library Asset (a lecture, a recitation), streamed, resuming at the
 * second the Believer stopped.
 */
export const AudioPlayer = ({
  asset,
  saved,
}: {
  asset: LibraryAsset;
  saved: number | null;
}) => {
  const { t } = useTranslation("library-assets");
  const report = usePositionSaver(asset.id);
  const player = useAudioPlayer(libraryFileUrl(asset.fileKey), {
    updateInterval: STATUS_INTERVAL_MS,
  });
  const status = useAudioPlayerStatus(player);
  const resumedRef = useRef(false);
  const [dragging, setDragging] = useState<number | null>(null);

  useEffect(() => {
    // Listening is the point of the screen: play with the ringer off too.
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (resumedRef.current || !status.isLoaded || status.duration <= 0) {
      return;
    }
    resumedRef.current = true;
    const at = resumePosition("audio", saved, status.duration);
    if (at > 0) {
      void player.seekTo(at);
    }
  }, [player, saved, status.isLoaded, status.duration]);

  useEffect(() => {
    if (resumedRef.current && status.isLoaded && status.currentTime > 0) {
      report(status.currentTime);
    }
  }, [report, status.isLoaded, status.currentTime]);

  const seek = (seconds: number) => {
    void player.seekTo(Math.min(Math.max(0, seconds), status.duration));
  };
  const shown = dragging ?? status.currentTime;

  return (
    <View className="gap-6">
      <CoverImage asset={asset} size={220} />
      <Slider
        label={t("player.position")}
        min={0}
        max={Math.max(status.duration, 1)}
        value={shown}
        disabled={!status.isLoaded}
        onValueChange={setDragging}
        onValueCommit={(value) => {
          setDragging(null);
          seek(value);
        }}
      />
      <View className="flex-row justify-between">
        <Text muted size="sm">
          {formatDuration(shown)}
        </Text>
        <Text muted size="sm">
          {formatDuration(status.duration)}
        </Text>
      </View>
      <View className="flex-row items-center justify-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("player.back", { seconds: SKIP_SECONDS })}
          disabled={!status.isLoaded}
          onPress={() => seek(status.currentTime - SKIP_SECONDS)}
        >
          <RotateCcwIcon size={24} />
        </Button>
        <Button
          size="icon"
          accessibilityLabel={
            status.playing ? t("player.pause") : t("player.play")
          }
          disabled={!status.isLoaded}
          onPress={() => (status.playing ? player.pause() : player.play())}
        >
          {status.playing ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("player.forward", { seconds: SKIP_SECONDS })}
          disabled={!status.isLoaded}
          onPress={() => seek(status.currentTime + SKIP_SECONDS)}
        >
          <RotateCwIcon size={24} />
        </Button>
      </View>
    </View>
  );
};
