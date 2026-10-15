import { resumePosition } from "@alrisali/domain/library-assets";
import type { LibraryAsset } from "@alrisali/domain/library-assets";
import { Badge, Button, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Pdf from "react-native-pdf";

import { libraryFileUrl } from "../data/library-assets";
import { usePositionSaver } from "../hooks/use-position-saver";

/**
 * A PDF Library Asset, opened on the page the Believer left it at. The file is
 * downloaded once and kept (by its key: a new upload is a new file).
 */
export const PdfViewer = ({
  asset,
  saved,
}: {
  asset: LibraryAsset;
  saved: number | null;
}) => {
  const { t } = useTranslation("library-assets");
  const report = usePositionSaver(asset.id);
  // Where the PDF opens; only its load moves it (into a shorter file), never
  // a later save, so reading is never pulled back.
  const [openPage, setOpenPage] = useState(() =>
    resumePosition("pdf", saved, null)
  );
  const [reading, setReading] = useState<{
    page: number;
    pages: number;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6">
        <Text muted className="text-center">
          {t("loadError")}
        </Text>
        <Button
          variant="outline"
          onPress={() => {
            // Reload where the Believer was.
            if (reading) {
              setOpenPage(reading.page);
            }
            setFailed(false);
            setAttempt((current) => current + 1);
          }}
        >
          {t("retry")}
        </Button>
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <Pdf
        key={attempt}
        style={{ flex: 1 }}
        source={{
          uri: libraryFileUrl(asset.fileKey),
          cache: true,
          cacheFileName: asset.fileKey.replaceAll(/[^\w.-]/gu, "-"),
        }}
        page={openPage}
        trustAllCerts={false}
        onLoadComplete={(pages) => {
          setOpenPage((opening) => resumePosition("pdf", opening, pages));
        }}
        onPageChanged={(current, pages) => {
          setReading({ page: current, pages });
          report(current);
        }}
        onError={() => setFailed(true)}
      />
      {reading ? (
        <View className="absolute bottom-6 items-center self-center">
          <Badge variant="secondary">
            {t("pdf.page", { page: reading.page, pages: reading.pages })}
          </Badge>
        </View>
      ) : null}
    </View>
  );
};
