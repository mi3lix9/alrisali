import "../i18n";
import { sendsNotifications } from "@alrisali/domain/reminders";
import { BottomSheet, Button, Text } from "panelui-native";
import { ChevronLeftIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  useReminderSettings,
  useUpdateReminderSettings,
} from "../data/reminder-settings";
import { useNotificationAccess } from "../hooks/use-notification-permission";
import { useSoundPreview } from "../hooks/use-sound-preview";
import { askNotificationsInContext } from "../utils/ask-notifications";
import { ruleChange, ruleOf } from "../utils/reminder-key";
import type { ReminderKey } from "../utils/reminder-key";
import { AtTimePage } from "./at-time-page";
import { BeforePage } from "./before-page";
import { ReminderSummaryPage } from "./reminder-summary-page";
import type { ReminderPage } from "./reminder-summary-page";
import { VoicePage } from "./voice-page";

/**
 * One Prayer Time's alerts in a bottom sheet: sentences saying what they will
 * do (with a play button), and rows that open the At-Time, Adhan voice and
 * Reminder-before pages inside the sheet. Every change saves at once. Mounted
 * while open.
 */
export const ReminderSheet = ({
  reminderKey,
  onClose,
}: {
  reminderKey: ReminderKey;
  onClose: () => void;
}) => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useReminderSettings();
  const { mutate: update } = useUpdateReminderSettings();
  const { access, refresh } = useNotificationAccess();
  const preview = useSoundPreview();
  const [page, setPage] = useState<ReminderPage>("root");

  if (!settings) {
    return null;
  }
  const rule = ruleOf(settings, reminderKey);
  const name = t(`names.${reminderKey}`);

  const save = (change: Parameters<typeof ruleChange>[1]) => {
    update(ruleChange(reminderKey, change), {
      onSuccess: async (saved) => {
        // The first alert that will arrive asks for notifications.
        if (sendsNotifications(saved)) {
          await askNotificationsInContext();
          await refresh();
        }
      },
    });
  };

  const goTo = (next: ReminderPage) => {
    preview.stop();
    setPage(next);
  };

  const heading = {
    root: name,
    atTime: t("sheet.atTime"),
    voice: t("sheet.voice"),
    before: t("sheet.before"),
  }[page];

  return (
    <BottomSheet
      open
      onOpenChange={(next) => {
        if (!next) {
          preview.stop();
          onClose();
        }
      }}
    >
      <BottomSheet.Content size="half">
        <BottomSheet.Header
          description={page === "root" ? undefined : name}
          title={
            page === "root" ? (
              heading
            ) : (
              <View className="-ms-2 flex-row items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  testID="reminder-sheet-back"
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
              needsPermission={
                access !== undefined && !access.granted && access.canAsk
              }
              preview={preview}
              onOpenPage={goTo}
            />
          ) : null}
          {page === "atTime" ? (
            <AtTimePage
              reminderKey={reminderKey}
              rule={rule}
              ramadanOnly={
                reminderKey === "imsak" ? settings.imsak.ramadanOnly : undefined
              }
              onChange={save}
              onRamadanOnlyChange={(ramadanOnly) =>
                update({ imsak: { ramadanOnly } })
              }
            />
          ) : null}
          {page === "voice" ? (
            <VoicePage rule={rule} preview={preview} onChange={save} />
          ) : null}
          {page === "before" ? (
            <BeforePage
              name={name}
              rule={rule}
              preview={preview}
              onChange={save}
            />
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
