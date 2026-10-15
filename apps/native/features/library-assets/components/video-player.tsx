import { resumePosition } from "@alrisali/domain/library-assets";
import type { LibraryAsset } from "@alrisali/domain/library-assets";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { Text } from "panelui-native";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { libraryFileUrl } from "../data/library-assets";
import { usePositionSaver } from "../hooks/use-position-saver";

/** How often the playing position is reported for saving. */
const REPORT_INTERVAL_MS = 1000;
const WIDESCREEN = 16 / 9;

/**
 * A video Library Asset, streamed in the platform's player (full screen
 * available), resuming at the second the Believer stopped.
 */
export const VideoPlayer = ({
  asset,
  saved,
}: {
  asset: LibraryAsset;
  saved: number | null;
}) => {
  const { t } = useTranslation("library-assets");
  const report = usePositionSaver(asset.id);
  const player = useVideoPlayer(libraryFileUrl(asset.fileKey));
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  const resumedRef = useRef(false);

  useEffect(() => {
    if (resumedRef.current || status !== "readyToPlay") {
      return;
    }
    resumedRef.current = true;
    const at = resumePosition(
      "video",
      saved,
      player.duration > 0 ? player.duration : null
    );
    if (at > 0) {
      player.seekBy(at - player.currentTime);
    }
  }, [player, saved, status]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (resumedRef.current && player.playing && player.currentTime > 0) {
        report(player.currentTime);
      }
    }, REPORT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [player, report]);

  return (
    <View className="gap-3">
      <VideoView
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
        style={{ width: "100%", aspectRatio: WIDESCREEN }}
      />
      {status === "error" ? (
        <Text muted className="text-center">
          {t("loadError")}
        </Text>
      ) : null}
    </View>
  );
};
