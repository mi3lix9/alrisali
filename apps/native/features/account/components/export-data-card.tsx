import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import "../i18n";
import { useExportUserData } from "../hooks/use-export-user-data";

/** Every Believer's own copy of their records, as JSON (shown in Settings). */
export const ExportDataCard = () => {
  const { t } = useTranslation("account");
  const { exportAll, exporting } = useExportUserData();

  const share = async () => {
    if ((await exportAll()) === "failed") {
      Alert.alert(t("export.failedTitle"), t("export.failed"), [
        { text: t("export.ok") },
      ]);
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("export.title")}</Card.Title>
        <Card.Description>{t("export.description")}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          variant="outline"
          testID="account-export-data"
          loading={exporting}
          onPress={share}
        >
          {t("export.button")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
