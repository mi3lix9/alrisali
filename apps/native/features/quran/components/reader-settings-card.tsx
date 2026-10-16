import "../i18n";
import { Card, Spinner } from "panelui-native";
import { useTranslation } from "react-i18next";

import {
  useQuranReaderSettings,
  useUpdateQuranReaderSettings,
} from "../data/reader-settings";
import { ReaderSettingsControls } from "./reader-settings-controls";

/** The Quran reader's settings, for the Settings screen. */
export const QuranReaderSettingsCard = () => {
  const { t } = useTranslation("quran");
  const settings = useQuranReaderSettings();
  const update = useUpdateQuranReaderSettings();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("settings.title")}</Card.Title>
      </Card.Header>
      <Card.Content>
        {settings.data ? (
          <ReaderSettingsControls
            settings={settings.data}
            onChange={(change) => update.mutate(change)}
          />
        ) : (
          <Spinner />
        )}
      </Card.Content>
    </Card>
  );
};
