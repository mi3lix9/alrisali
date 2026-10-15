import "../i18n";
import { localized } from "@alrisali/domain/shared";
import { Stack, useLocalSearchParams } from "expo-router";
import { Spinner, Text } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { AssetDetails } from "../components/asset-details";
import { AudioPlayer } from "../components/audio-player";
import { PdfViewer } from "../components/pdf-viewer";
import { TextReader } from "../components/text-reader";
import { VideoPlayer } from "../components/video-player";
import { useLibraryAsset } from "../data/library-assets";
import { useSavedPosition } from "../data/positions";

/**
 * Opens a published Library Asset in the viewer for its kind (PDF, audio,
 * video, structured text) where the Believer left it. A route can add other
 * features' controls for the asset in the header (`headerRight`).
 */
export const LibraryAssetScreen = ({
  headerRight,
}: {
  headerRight?: (assetId: string) => ReactNode;
}) => {
  const { t } = useTranslation("library-assets");
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = useLibraryAsset(id);
  const saved = useSavedPosition(id);

  // Until the asset is read, the header shows the feature's title rather
  // than the route's file name.
  if (asset.isPending || saved.isPending || !asset.data) {
    return (
      <>
        <Stack.Screen options={{ title: t("title") }} />
        <Screen>
          {asset.isPending || saved.isPending ? (
            <Spinner label={t("loading")} />
          ) : (
            <Text muted>{t("notFound")}</Text>
          )}
        </Screen>
      </>
    );
  }

  const opened = asset.data;
  // A position that cannot be read opens the asset at its start.
  const position = saved.data ?? null;
  const header = (
    <Stack.Screen
      options={{
        title: localized(opened.title, launchLanguage),
        headerLargeTitle: false,
        ...(headerRight && { headerRight: () => headerRight(opened.id) }),
      }}
    />
  );

  switch (opened.kind) {
    case "pdf": {
      return (
        <>
          {header}
          <PdfViewer asset={opened} saved={position} />
        </>
      );
    }
    case "text": {
      return (
        <>
          {header}
          <TextReader
            asset={opened}
            saved={position}
            header={<AssetDetails asset={opened} />}
          />
        </>
      );
    }
    case "audio": {
      return (
        <>
          {header}
          <Screen>
            <AudioPlayer asset={opened} saved={position} />
            <AssetDetails asset={opened} />
          </Screen>
        </>
      );
    }
    case "video": {
      return (
        <>
          {header}
          <Screen>
            <VideoPlayer asset={opened} saved={position} />
            <AssetDetails asset={opened} />
          </Screen>
        </>
      );
    }
    default: {
      const unknown: never = opened.kind;
      throw new Error(`No viewer for ${String(unknown)}`);
    }
  }
};
