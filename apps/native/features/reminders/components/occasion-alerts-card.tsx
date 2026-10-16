import { OCCASION_ALERT_TIMINGS } from "@alrisali/domain/reminders";
import { OCCASION_TYPES } from "@alrisali/domain/shared";
import {
  Card,
  Chip,
  Item,
  RadioGroup,
  Switch,
  Text,
  TimePicker,
} from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import {
  useOccasionAlertSettings,
  useUpdateOccasionAlertSettings,
} from "../data/occasion-alert-settings";

const MINUTES_PER_HOUR = 60;

/**
 * Occasion alerts: on the day or the evening before (from Maghrib), at a
 * chosen time, for the chosen types of Occasion. Off until the Believer
 * opts in.
 */
export const OccasionAlertsCard = () => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useOccasionAlertSettings();
  const { mutate: update } = useUpdateOccasionAlertSettings();

  if (!settings) {
    return null;
  }
  const { enabled, timing, time, types } = settings;

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("occasionAlerts.title")}</Card.Title>
        <Card.Description>{t("occasionAlerts.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        <Item size="sm">
          <Item.Content>
            <Item.Title>{t("occasionAlerts.enabled")}</Item.Title>
          </Item.Content>
          <Item.Actions>
            <Switch
              label={t("occasionAlerts.enabled")}
              value={enabled}
              onValueChange={(next) => update({ enabled: next })}
            />
          </Item.Actions>
        </Item>
        <Text weight="medium">{t("occasionAlerts.timing")}</Text>
        <RadioGroup
          accessibilityLabel={t("occasionAlerts.timing")}
          value={timing}
          disabled={!enabled}
          onValueChange={(value) => {
            const next = OCCASION_ALERT_TIMINGS.find(
              (option) => option === value
            );
            if (next) {
              update({ timing: next });
            }
          }}
        >
          {OCCASION_ALERT_TIMINGS.map((option) => (
            <RadioGroup.Item
              key={option}
              value={option}
              label={t(`occasionAlerts.timings.${option}`)}
            />
          ))}
        </RadioGroup>
        {timing === "evening-before" ? (
          <Text muted>{t("occasionAlerts.eveningHint")}</Text>
        ) : null}
        <View className="gap-2">
          <Text weight="medium">{t("occasionAlerts.time")}</Text>
          <TimePicker
            value={{
              hour: Math.floor(time / MINUTES_PER_HOUR),
              minute: time % MINUTES_PER_HOUR,
            }}
            locale={launchLanguage}
            disabled={!enabled}
            onValueChange={({ hour, minute }) =>
              update({ time: hour * MINUTES_PER_HOUR + minute })
            }
          />
        </View>
        <Text weight="medium">{t("occasionAlerts.types")}</Text>
        <View className="flex-row flex-wrap gap-2">
          {OCCASION_TYPES.map((type) => {
            const selected = types.includes(type);
            return (
              <Chip
                key={type}
                size="lg"
                variant={selected ? "primary" : "outline"}
                selected={selected}
                disabled={!enabled}
                onPress={() =>
                  update({
                    types: selected
                      ? types.filter((other) => other !== type)
                      : [...types, type],
                  })
                }
              >
                {t(`occasionAlerts.typeNames.${type}`)}
              </Chip>
            );
          })}
        </View>
      </Card.Content>
    </Card>
  );
};
