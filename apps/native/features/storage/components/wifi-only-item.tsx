import "../i18n";
import { Item, Switch } from "panelui-native";
import { useTranslation } from "react-i18next";

import { setWifiOnly, useWifiOnly } from "@/shared/lib/downloads/connection";

/** The Wi-Fi only switch every download follows. */
export const WifiOnlyItem = () => {
  const { t } = useTranslation("storage");
  const wifiOnly = useWifiOnly();

  return (
    <Item size="sm">
      <Item.Content>
        <Item.Title>{t("wifiOnly.title")}</Item.Title>
        <Item.Description>{t("wifiOnly.description")}</Item.Description>
      </Item.Content>
      <Item.Actions>
        <Switch
          label={t("wifiOnly.title")}
          value={wifiOnly}
          onValueChange={setWifiOnly}
        />
      </Item.Actions>
    </Item>
  );
};
