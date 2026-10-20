import { NIGHT_DUA_ALERTS } from "@alrisali/domain/reminders";
import type {
  NightDuaAlert,
  NightDuaAlertsChange,
  NightDuaAlerts,
} from "@alrisali/domain/reminders";
import { Card, Item, Switch } from "panelui-native";
import { useTranslation } from "react-i18next";

/** Kumayl, Tawassul, Nudba and the ziyarah of the day: one switch each. */
export const NightDuaCard = ({
  alerts,
  onChange,
}: {
  alerts: NightDuaAlerts;
  onChange: (change: NightDuaAlertsChange) => void;
}) => {
  const { t } = useTranslation("reminders");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("nightDua.title")}</Card.Title>
        <Card.Description>{t("nightDua.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        {NIGHT_DUA_ALERTS.map((alert: NightDuaAlert) => (
          <Item key={alert} size="sm">
            <Item.Content>
              <Item.Title>{t(`nightDua.${alert}`)}</Item.Title>
              <Item.Description>{t(`nightDua.${alert}Hint`)}</Item.Description>
            </Item.Content>
            <Item.Actions>
              <Switch
                label={t(`nightDua.${alert}`)}
                value={alerts[alert]}
                onValueChange={(enabled) => onChange({ [alert]: enabled })}
              />
            </Item.Actions>
          </Item>
        ))}
      </Card.Content>
    </Card>
  );
};
