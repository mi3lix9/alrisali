import "../i18n";
import { Card } from "panelui-native";
import { useTranslation } from "react-i18next";

import { FeedbackModePicker } from "./feedback-mode-picker";

/** The Tasbih feedback mode, for the Settings screen. */
export const TasbihSettingsCard = () => {
  const { t } = useTranslation("tasbih");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("settings.title")}</Card.Title>
        <Card.Description>{t("settings.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <FeedbackModePicker />
      </Card.Content>
    </Card>
  );
};
