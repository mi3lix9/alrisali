import type { QuietHours as QuietHoursSettings } from "@alrisali/domain/reminders";
import { Item, Switch, Text, TimePicker } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

const MINUTES_PER_HOUR = 60;

const toTime = (minuteOfDay: number) => ({
  hour: Math.floor(minuteOfDay / MINUTES_PER_HOUR),
  minute: minuteOfDay % MINUTES_PER_HOUR,
});

/** The quiet hours: a switch and the times they run from and to. */
export const QuietHours = ({
  quietHours,
  onChange,
}: {
  quietHours: QuietHoursSettings;
  onChange: (change: Partial<QuietHoursSettings>) => void;
}) => {
  const { t } = useTranslation("reminders");

  return (
    <View className="gap-3">
      <Text weight="semibold" size="lg">
        {t("quietHours.title")}
      </Text>
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
        <View key={edge} className="gap-2 px-3">
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
      <Text size="sm" muted>
        {t("quietHours.description")}
      </Text>
    </View>
  );
};
