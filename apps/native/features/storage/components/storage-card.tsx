import "../i18n";
import { summarizeStorage } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useFormatSize } from "@/shared/lib/downloads/format-size";
import { useStoredFiles } from "@/shared/lib/downloads/store";

/** Settings' link to the Storage screen, showing what is downloaded. */
export const StorageCard = () => {
  const { t } = useTranslation("storage");
  const formatSize = useFormatSize();
  const { bytes } = summarizeStorage(useStoredFiles());

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>
          {t("settingsCard.description")} {formatSize(bytes)}
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          variant="outline"
          testID="settings-storage"
          onPress={() => router.push("/settings/storage")}
        >
          {t("settingsCard.open")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
