import "../i18n";
import { alertTypeOf } from "@alrisali/domain/reminders";
import { BottomSheet, Button, Text } from "panelui-native";
import { ChevronLeftIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  useReminderSettings,
  useUpdateReminderSettings,
} from "../data/reminder-settings";
import { useSoundPreview } from "../hooks/use-sound-preview";
import { ruleChange, ruleOf } from "../utils/reminder-key";
import type { ReminderKey } from "../utils/reminder-key";
import { AlertTypePage } from "./alert-type-page";
import { ReminderSummaryPage } from "./reminder-summary-page";
import type { ReminderPage } from "./reminder-summary-page";
import { SoundPage } from "./sound-page";
import { TimingPage } from "./timing-page";

/**
 * One Prayer Time's Reminder in a bottom sheet: a sentence saying what it
 * will do, and rows that open the Alert, Sound and Timing pages inside the
 * sheet. Every change saves at once. `time` is the Prayer Time, when the
 * caller knows it.
 */
export const ReminderSheet = ({
  reminderKey,
  time,
  open,
  onOpenChange,
}: {
  reminderKey: ReminderKey;
  time?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useReminderSettings();
  const { mutate: update } = useUpdateReminderSettings();
  const preview = useSoundPreview();
  const { stop } = preview;
  const [page, setPage] = useState<ReminderPage>("root");

  const changeOpen = (next: boolean) => {
    if (!next) {
      stop();
      setPage("root");
    }
    onOpenChange(next);
  };

  const goTo = (next: ReminderPage) => {
    stop();
    setPage(next);
  };

  if (!settings) {
    return null;
  }
  const rule = ruleOf(settings, reminderKey);
  const onChange = (change: Parameters<typeof ruleChange>[1]) =>
    update(ruleChange(reminderKey, change));
  const name = t(`names.${reminderKey}`);

  let heading = name;
  if (page === "alert") {
    heading = t("alertType.title");
  } else if (page === "sound") {
    heading = t(alertTypeOf(rule) === "adhan" ? "rule.adhan" : "rule.sound");
  } else if (page === "timing") {
    heading = t("sheet.timing");
  }

  return (
    <BottomSheet open={open} onOpenChange={changeOpen}>
      <BottomSheet.Content size="half">
        <BottomSheet.Header
          description={page === "root" ? time : name}
          title={
            page === "root" ? (
              heading
            ) : (
              <View className="-ms-2 flex-row items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  accessibilityLabel={t("sheet.back")}
                  onPress={() => goTo("root")}
                >
                  <ChevronLeftIcon size={20} />
                </Button>
                <Text size="lg" weight="semibold">
                  {heading}
                </Text>
              </View>
            )
          }
        />
        <BottomSheet.Body className="pb-6">
          {page === "root" ? (
            <ReminderSummaryPage
              reminderKey={reminderKey}
              rule={rule}
              preview={preview}
              onOpenPage={goTo}
            />
          ) : null}
          {page === "alert" ? (
            <AlertTypePage rule={rule} onChange={onChange} />
          ) : null}
          {page === "sound" ? (
            <SoundPage rule={rule} onChange={onChange} preview={preview} />
          ) : null}
          {page === "timing" ? (
            <TimingPage
              reminderKey={reminderKey}
              rule={rule}
              onChange={onChange}
            />
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
