import type { DhikrSessionExportFormat } from "@alrisali/domain/tasbih";
import { Button } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useExportDhikrSessions } from "../hooks/use-export-dhikr-sessions";

/** Asks for CSV or JSON, then shares every Dhikr Session in that format. */
export const ExportButton = () => {
  const { t } = useTranslation("tasbih");
  const { exportAs, exporting } = useExportDhikrSessions(t("tasbihAlZahra"));

  const share = async (format: DhikrSessionExportFormat) => {
    const result = await exportAs(format);
    if (result === "empty") {
      Alert.alert(t("export.emptyTitle"), t("export.empty"), [
        { text: t("export.ok") },
      ]);
    } else if (result === "failed") {
      Alert.alert(t("export.failedTitle"), t("export.failed"), [
        { text: t("export.ok") },
      ]);
    }
  };

  const chooseFormat = () =>
    Alert.alert(t("export.title"), t("export.message"), [
      { text: t("export.csv"), onPress: () => share("csv") },
      { text: t("export.json"), onPress: () => share("json") },
      { text: t("reset.cancel"), style: "cancel" },
    ]);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={exporting}
      onPress={chooseFormat}
    >
      {t("export.action")}
    </Button>
  );
};
