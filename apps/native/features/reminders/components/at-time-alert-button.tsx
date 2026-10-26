import "../i18n";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { Button } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useReminderSettings } from "../data/reminder-settings";
import { reminderKeyOf, ruleOf } from "../utils/reminder-key";
import { AtTimeIcon } from "./reminder-row";
import { ReminderSheet } from "./reminder-sheet";

/**
 * A timetable row's At-Time Alert: shows what happens at that Prayer Time and
 * opens its alerts sheet. Nothing for times without one (Sunrise, Midnight).
 */
export const AtTimeAlertButton = ({
  prayerTime,
}: {
  prayerTime: PrayerTimeName;
}) => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useReminderSettings();
  const [open, setOpen] = useState(false);
  const key = reminderKeyOf(prayerTime);

  if (key === null || !settings) {
    return null;
  }
  const { atTime } = ruleOf(settings, key);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        testID={`at-time-alert-${prayerTime}`}
        accessibilityLabel={t("button.label", {
          name: t(`names.${key}`),
          alert: t(`atTime.${atTime}.title`),
        })}
        onPress={() => setOpen(true)}
      >
        <AtTimeIcon atTime={atTime} />
      </Button>
      {open ? (
        <ReminderSheet reminderKey={key} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
};
