import "../i18n";
import { router } from "expo-router";
import { Card, Item } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useBelieverSettings } from "@/shared/lib/believer-settings";

/** Opens Prayer settings inside the Settings modal. */
export const PrayerSettingsCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("prayerSettings.title")}</Card.Title>
        <Card.Description>{t("prayerSettings.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Item
          size="sm"
          accessibilityRole="link"
          onPress={() => router.push("/settings/prayer")}
        >
          <Item.Content>
            <Item.Title>{t("prayerSettings.open")}</Item.Title>
            {settings ? (
              <Item.Description>
                {t(`calculationMethod.${settings.calculationMethod}`)}
              </Item.Description>
            ) : null}
          </Item.Content>
        </Item>
      </Card.Content>
    </Card>
  );
};
