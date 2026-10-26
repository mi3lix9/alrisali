import "../i18n";
import { alertTypeOf } from "@alrisali/domain/reminders";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { Button } from "panelui-native";
import { BellIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useReminderSettings } from "../data/reminder-settings";
import { reminderKeyOf, ruleOf } from "../utils/reminder-key";
import { ReminderSheet } from "./reminder-sheet";

const BELL_SIZE = 20;

/**
 * A bell on a Prayer Time's row showing whether its Reminder is off, silent,
 * plays a tone or the Adhan voice; it opens that Reminder's sheet. Prayer
 * Times without a Reminder (Sunrise, Sunset, Midnight) show nothing. `time`
 * is the Prayer Time as the row shows it.
 */
export const PrayerReminderBell = ({
  name,
  time,
}: {
  name: PrayerTimeName;
  time: string | null;
}) => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useReminderSettings();
  const [open, setOpen] = useState(false);

  const key = reminderKeyOf(name);
  if (!(key && settings)) {
    return null;
  }

  const type = alertTypeOf(ruleOf(settings, key));

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        testID={`reminder-bell-${key}`}
        accessibilityLabel={t("bell.label", {
          name: t(`names.${key}`),
          state: t(`bell.${type}`),
        })}
        onPress={() => setOpen(true)}
      >
        <View className={type === "off" ? "opacity-40" : ""}>
          <BellIcon size={BELL_SIZE} />
          {type === "off" ? (
            <View className="bg-foreground absolute start-0 top-2.5 h-0.5 w-5 -rotate-45 rounded-full" />
          ) : null}
          {type === "adhan" ? (
            <View className="bg-success border-background absolute -end-0.5 -top-0.5 size-2 rounded-full border" />
          ) : null}
          {type === "silent" ? (
            <View className="bg-muted-foreground border-background absolute -end-0.5 -top-0.5 size-2 rounded-full border" />
          ) : null}
        </View>
      </Button>
      <ReminderSheet
        reminderKey={key}
        time={time}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
