import "../i18n";
import type { AtTimeAlert } from "@alrisali/domain/reminders";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { Button } from "panelui-native";
import { AudioLinesIcon, BellIcon, MicIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useReminderSettings } from "../data/reminder-settings";
import { ALERTED_PRAYER_TIMES, AdhanEditorSheet } from "./adhan-editor-sheet";
import type { AlertedPrayerTime } from "./adhan-editor-sheet";

const ICON_SIZE = 20;

const AlertIcon = ({ alert }: { alert: AtTimeAlert }) => {
  switch (alert) {
    case "takbir": {
      return <AudioLinesIcon size={ICON_SIZE} />;
    }
    case "adhan": {
      return <MicIcon size={ICON_SIZE} />;
    }
    default: {
      return <BellIcon size={ICON_SIZE} filled={alert === "silent"} />;
    }
  }
};

const isAlerted = (name: PrayerTimeName): name is AlertedPrayerTime =>
  (ALERTED_PRAYER_TIMES as readonly string[]).includes(name);

/**
 * A timetable row's At-Time Alert: shows what happens at that Prayer Time and
 * opens the adhan editor. Nothing for times without one (Sunrise, Midnight).
 */
export const AtTimeAlertButton = ({
  prayerTime,
}: {
  prayerTime: PrayerTimeName;
}) => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useReminderSettings();
  const [open, setOpen] = useState(false);

  if (!isAlerted(prayerTime) || !settings) {
    return null;
  }
  const alert =
    prayerTime === "imsak"
      ? settings.imsak.atTime
      : settings.salah[prayerTime].atTime;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        testID={`at-time-alert-${prayerTime}`}
        accessibilityLabel={t("button.label", {
          name: t(`names.${prayerTime}`),
          alert: t(`atTime.${alert}.title`),
        })}
        onPress={() => setOpen(true)}
      >
        <AlertIcon alert={alert} />
      </Button>
      {open ? (
        <AdhanEditorSheet
          prayerTime={prayerTime}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
};
