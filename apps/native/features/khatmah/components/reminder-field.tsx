import "../i18n";
import { Item, Switch, Text, TimePicker } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

const MINUTES_PER_HOUR = 60;
/** Where the reminder time starts when the Believer turns it on. */
const DEFAULT_REMINDER_AT = 5 * MINUTES_PER_HOUR;

/**
 * The Khatmah's daily reminder: a switch and, while on, its time. `value` is
 * minutes after local midnight, null for none.
 */
export const ReminderField = ({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (reminderAt: number | null) => void;
}) => {
  const { t } = useTranslation("khatmah");
  return (
    <>
      <Item size="sm">
        <Item.Content>
          <Item.Title>{t("reminder.title")}</Item.Title>
          <Item.Description>{t("reminder.description")}</Item.Description>
        </Item.Content>
        <Item.Actions>
          <Switch
            label={t("reminder.title")}
            value={value !== null}
            onValueChange={(on) => onChange(on ? DEFAULT_REMINDER_AT : null)}
          />
        </Item.Actions>
      </Item>
      {value === null ? null : (
        <View className="gap-2">
          <Text weight="medium">{t("reminder.time")}</Text>
          <TimePicker
            value={{
              hour: Math.floor(value / MINUTES_PER_HOUR),
              minute: value % MINUTES_PER_HOUR,
            }}
            locale={launchLanguage}
            onValueChange={({ hour, minute }) =>
              onChange(hour * MINUTES_PER_HOUR + minute)
            }
          />
        </View>
      )}
    </>
  );
};
