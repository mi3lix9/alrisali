import "../i18n";
import {
  SALAH,
  selectableAdhanSound,
  sendsNotifications,
} from "@alrisali/domain/reminders";
import type {
  AdhanSound,
  ImsakRule,
  ReminderRule,
  ReminderSettings,
  ReminderSettingsChange,
  Salah,
} from "@alrisali/domain/reminders";
import { Alert, BottomSheet, Button, Chip, toast } from "panelui-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

import {
  useReminderSettings,
  useUpdateReminderSettings,
} from "../data/reminder-settings";
import { useAdhanVoices } from "../hooks/use-adhan-voices";
import { useNotificationAccess } from "../hooks/use-notification-permission";
import { stopAdhan } from "../utils/adhan-player";
import { askNotificationsInContext } from "../utils/ask-notifications";
import {
  AtTimeChoices,
  BeforeReminderOptions,
  SoundChoices,
  TestCard,
} from "./adhan-editor-sections";
import type { AlertDraft } from "./adhan-editor-sections";

/** The Prayer Times with an At-Time Alert, in the day's order. */
export const ALERTED_PRAYER_TIMES = ["imsak", ...SALAH] as const;

export type AlertedPrayerTime = (typeof ALERTED_PRAYER_TIMES)[number];

/** The change that saves a draft for its Prayer Time. */
const draftChange = (
  prayerTime: AlertedPrayerTime,
  draft: AlertDraft,
  installed: readonly AdhanSound[]
): ReminderSettingsChange => {
  const { ramadanOnly, ...chosen } = draft;
  // An adhan not downloaded cannot be the At-Time sound.
  const rule = {
    ...chosen,
    adhanSound: selectableAdhanSound(chosen.adhanSound, installed),
  };
  if (prayerTime === "imsak") {
    return {
      imsak: {
        ...rule,
        atTime: rule.atTime === "adhan" ? "takbir" : rule.atTime,
        ...(ramadanOnly === undefined ? {} : { ramadanOnly }),
      },
    };
  }
  return { salah: { [prayerTime satisfies Salah]: rule } };
};

const savedRule = (
  settings: ReminderSettings,
  prayerTime: AlertedPrayerTime
): ReminderRule | ImsakRule =>
  prayerTime === "imsak" ? settings.imsak : settings.salah[prayerTime];

/**
 * The adhan editor (one scrolling sheet): for each Salah and Imsak, what
 * happens at the Prayer Time itself, its sound, the Reminder before it, a
 * Test of the unsaved choice and Save. Mounted while open.
 */
export const AdhanEditorSheet = ({
  prayerTime,
  onClose,
}: {
  prayerTime: AlertedPrayerTime;
  onClose: () => void;
}) => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useReminderSettings();
  const update = useUpdateReminderSettings();
  const [editing, setEditing] = useState(prayerTime);
  const [draft, setDraft] = useState<AlertDraft | null>(null);
  const { access, refresh } = useNotificationAccess();
  const { installed } = useAdhanVoices();

  // Whatever the Test plays stops with the sheet.
  useEffect(() => stopAdhan, []);

  const rule: AlertDraft | null =
    draft ?? (settings ? savedRule(settings, editing) : null);
  const name = t(`names.${editing}`);

  const close = () => {
    stopAdhan();
    onClose();
  };

  const change = (patch: Partial<AlertDraft>) => {
    if (rule) {
      setDraft({ ...rule, ...patch });
    }
  };

  const save = () => {
    if (!rule) {
      return;
    }
    update.mutate(draftChange(editing, rule, installed), {
      onSuccess: async (saved) => {
        // The first alert that will arrive asks for notifications.
        if (sendsNotifications(saved)) {
          await askNotificationsInContext();
          await refresh();
        }
        toast.show({
          variant: "success",
          label: t("editor.saved", {
            name,
            alert: t(`atTime.${rule.atTime}.title`),
          }),
        });
        close();
      },
    });
  };

  const asksPermission =
    access !== undefined && !access.granted && access.canAsk;
  const sounding = rule?.atTime === "takbir" || rule?.atTime === "adhan";

  return (
    <BottomSheet
      open
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header title={t("editor.title", { name })} />
        <BottomSheet.Body className="gap-4 pb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {ALERTED_PRAYER_TIMES.map((option) => (
                <Chip
                  key={option}
                  testID={`adhan-editor-chip-${option}`}
                  selected={option === editing}
                  onPress={() => {
                    // Another Prayer Time: its saved rule, unsaved changes go.
                    stopAdhan();
                    setEditing(option);
                    setDraft(null);
                  }}
                >
                  {t(`names.${option}`)}
                </Chip>
              ))}
            </View>
          </ScrollView>
          {rule ? (
            <>
              {asksPermission && rule.atTime !== "off" ? (
                <Alert variant="info" testID="adhan-editor-permission-reason">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{t("editor.permissionTitle")}</Alert.Title>
                    <Alert.Description>
                      {t("editor.permissionReason")}
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
              <AtTimeChoices
                rule={rule}
                imsak={editing === "imsak"}
                onChange={change}
              />
              {sounding ? (
                <SoundChoices
                  rule={rule}
                  onChange={(adhanSound) => change({ adhanSound })}
                />
              ) : null}
              <BeforeReminderOptions
                rule={rule}
                name={name}
                imsak={editing === "imsak"}
                onChange={change}
              />
              <TestCard
                // A new Prayer Time starts a new Test.
                key={editing}
                rule={rule}
                name={name}
                sounding={sounding}
              />
              <View className="flex-row gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  testID="adhan-editor-cancel"
                  onPress={close}
                >
                  {t("editor.cancel")}
                </Button>
                <Button
                  className="flex-[2]"
                  testID="adhan-editor-save"
                  disabled={update.isPending}
                  onPress={save}
                >
                  {t("editor.save")}
                </Button>
              </View>
            </>
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
