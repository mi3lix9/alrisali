import { ALWAYS_SHOWN_TAB, TABS, visibleTabs } from "@alrisali/domain/shared";
import { Card, Item, Switch } from "panelui-native";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { usePreferences } from "@/shared/lib/preferences";

/** Which tabs appear in the tab bar; a change applies at once. */
export const TabsCard = () => {
  const { t } = useTranslation("settings");
  const { t: tShell } = useTranslation();
  const hiddenTabs = usePreferences((state) => state.hiddenTabs);
  const setTabVisible = usePreferences((state) => state.setTabVisible);
  const shown = visibleTabs(hiddenTabs);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("tabs.title")}</Card.Title>
        <Card.Description>{t("tabs.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Item.Group>
          {TABS.map((tab, index) => {
            const label = tShell(`tabs.${tab}`);
            const alwaysShown = tab === ALWAYS_SHOWN_TAB;
            return (
              <Fragment key={tab}>
                {index > 0 && <Item.Separator />}
                <Item size="sm">
                  <Item.Content>
                    <Item.Title>{label}</Item.Title>
                    {alwaysShown && (
                      <Item.Description>
                        {t("tabs.homeAlwaysShown")}
                      </Item.Description>
                    )}
                  </Item.Content>
                  <Item.Actions>
                    <Switch
                      label={label}
                      value={shown.includes(tab)}
                      disabled={alwaysShown}
                      onValueChange={(visible) => setTabVisible(tab, visible)}
                    />
                  </Item.Actions>
                </Item>
              </Fragment>
            );
          })}
        </Item.Group>
      </Card.Content>
    </Card>
  );
};
