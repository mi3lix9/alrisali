import type { QuietHours } from "@alrisali/domain/reminders";
import { Card, Item, Switch, Text, TimePicker } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

const MINUTES_PER_HOUR = 60;

const toTime = (minuteOfDay: number) => ({
  hour: Math.floor(minuteOfDay / MINUTES_PER_HOUR),
  minute: minuteOfDay % MINUTES_PER_HOUR,
});

export const QuietHoursCard = ({
  quietHours,
  onChange,
}: {
  quietHours: QuietHours;
  onChange: (change: Partial<QuietHours>) => void;
}) => {
  const { t } = useTranslation("reminders");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("quietHours.title")}</Card.Title>
        <Card.Description>{t("quietHours.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        <Item size="sm">
          <Item.Content>
            <Item.Title>{t("quietHours.enabled")}</Item.Title>
          </Item.Content>
          <Item.Actions>
            <Switch
              label={t("quietHours.enabled")}
              value={quietHours.enabled}
              onValueChange={(enabled) => onChange({ enabled })}
            />
          </Item.Actions>
        </Item>
        {(["start", "end"] as const).map((edge) => (
          <View key={edge} className="gap-2">
            <Text weight="medium">{t(`quietHours.${edge}`)}</Text>
            <TimePicker
              value={toTime(quietHours[edge])}
              locale={launchLanguage}
              disabled={!quietHours.enabled}
              onValueChange={({ hour, minute }) =>
                onChange({ [edge]: hour * MINUTES_PER_HOUR + minute })
              }
            />
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};
