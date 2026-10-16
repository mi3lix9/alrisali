import "../i18n";
import {
  allSalahAtTime,
  AT_TIME_ALERTS,
  atTimeForAllSalah,
  isFullAdhanAvailable,
  SALAH,
} from "@alrisali/domain/reminders";
import type { AtTimeAlert, Salah } from "@alrisali/domain/reminders";
import { Card, Chip, Item, Switch, Text } from "panelui-native";
import { BellIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

import { INSTALLED_ADHAN_SOUNDS } from "../data/adhan-catalogue";
import {
  useReminderSettings,
  useUpdateReminderSettings,
} from "../data/reminder-settings";

/** The At-Time Alerts a Believer can pick: the full adhan only once installed. */
const CHOICES: readonly AtTimeAlert[] = AT_TIME_ALERTS.filter(
  (kind) => kind !== "adhan" || isFullAdhanAvailable(INSTALLED_ADHAN_SOUNDS)
);

/** A prayer notification as it will look, shown before anything is asked. */
const NotificationPreview = () => {
  const { t } = useTranslation("reminders");
  return (
    <Card testID="onboarding-alert-preview">
      <Card.Content className="gap-1 pt-6">
        <Text muted size="xs">
          {t("onboarding.previewLabel")}
        </Text>
        <View className="flex-row items-center gap-3">
          <BellIcon size={24} filled />
          <View className="flex-1">
            <View className="flex-row justify-between">
              <Text weight="medium" size="sm">
                {t("onboarding.previewApp")}
              </Text>
              <Text muted size="xs">
                {t("onboarding.previewNow")}
              </Text>
            </View>
            <Text>{t("notification.salahNow", { name: t("names.fajr") })}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

/**
 * Onboarding's alert choices: a preview of a prayer notification, then each
 * Salah's At-Time Alert with "enable all". Saved as chosen; nothing here asks
 * for notifications, and skipping keeps the suggested defaults.
 */
export const OnboardingAlerts = () => {
  const { t } = useTranslation("reminders");
  const { data: settings } = useReminderSettings();
  const { mutate: update } = useUpdateReminderSettings();

  if (!settings) {
    return null;
  }
  const choose = (salah: Salah, atTime: AtTimeAlert) =>
    update({ salah: { [salah]: { atTime } } });

  return (
    <View className="gap-4">
      <NotificationPreview />
      <Text weight="medium">{t("onboarding.sectionTitle")}</Text>
      <Item size="sm">
        <Item.Content>
          <Item.Title>{t("onboarding.enableAll")}</Item.Title>
          <Item.Description>{t("onboarding.enableAllHint")}</Item.Description>
        </Item.Content>
        <Item.Actions>
          <Switch
            label={t("onboarding.enableAll")}
            value={allSalahAtTime(settings, "takbir")}
            onValueChange={(on) =>
              update(atTimeForAllSalah(on ? "takbir" : "off"))
            }
          />
        </Item.Actions>
      </Item>
      {SALAH.map((salah) => (
        <View key={salah} className="gap-2">
          <Text>{t(`names.${salah}`)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {CHOICES.map((kind) => (
                <Chip
                  key={kind}
                  testID={`onboarding-alert-${salah}-${kind}`}
                  selected={settings.salah[salah].atTime === kind}
                  onPress={() => choose(salah, kind)}
                >
                  {t(`atTime.${kind}.title`)}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
      <Text muted size="xs">
        {t("onboarding.skipHint")}
      </Text>
    </View>
  );
};
