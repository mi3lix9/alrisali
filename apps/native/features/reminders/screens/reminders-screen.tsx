import "../i18n";
import { SALAH } from "@alrisali/domain/reminders";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { AdhanServiceCard } from "../components/adhan-service-card";
import { NightDuaCard } from "../components/night-dua-card";
import { QuietHoursCard } from "../components/quiet-hours-card";
import { RuleCard } from "../components/rule-card";
import {
  useNightDuaAlerts,
  useUpdateNightDuaAlerts,
} from "../data/night-dua-alerts";
import {
  useReminderSettings,
  useUpdateReminderSettings,
} from "../data/reminder-settings";
import { useNotificationAccess } from "../hooks/use-notification-permission";

/** Each Salah's Reminder, Imsak's, and the quiet hours. */
export const RemindersScreen = () => {
  const { t } = useTranslation("reminders");
  const { data: believer } = useBelieverSettings();
  const { data: settings } = useReminderSettings();
  const { mutate: update } = useUpdateReminderSettings();
  const { data: nightDuas } = useNightDuaAlerts();
  const { mutate: updateNightDuas } = useUpdateNightDuaAlerts();
  const { access, allow, allowExactAlarms } = useNotificationAccess();

  return (
    <Screen>
      <Text muted>{t("screen.intro")}</Text>
      {access && !access.granted ? (
        <Card>
          <Card.Content className="gap-4 pt-6">
            <Text>{t("screen.denied")}</Text>
            <Button onPress={() => allow()}>
              {access.canAsk ? t("screen.allow") : t("screen.openSettings")}
            </Button>
          </Card.Content>
        </Card>
      ) : null}
      {access?.granted && !access.exactAlarms ? (
        <Card>
          <Card.Content className="gap-4 pt-6">
            <Text>{t("screen.exactAlarms")}</Text>
            <Button onPress={() => allowExactAlarms()}>
              {t("screen.allowExactAlarms")}
            </Button>
          </Card.Content>
        </Card>
      ) : null}
      {believer && !believer.location ? (
        <Text muted>{t("screen.noLocation")}</Text>
      ) : null}
      {settings ? (
        <>
          <Text weight="semibold" size="lg">
            {t("screen.salahTitle")}
          </Text>
          {SALAH.map((salah) => (
            <RuleCard
              key={salah}
              title={t(`names.${salah}`)}
              rule={settings.salah[salah]}
              onChange={(change) => update({ salah: { [salah]: change } })}
            />
          ))}
          <RuleCard
            title={t("screen.imsakTitle")}
            description={t("screen.imsakDescription")}
            rule={settings.imsak}
            onChange={(imsak) => update({ imsak })}
          />
          <QuietHoursCard
            quietHours={settings.quietHours}
            onChange={(quietHours) => update({ quietHours })}
          />
        </>
      ) : null}
      {nightDuas ? (
        <NightDuaCard alerts={nightDuas} onChange={updateNightDuas} />
      ) : null}
      <AdhanServiceCard />
    </Screen>
  );
};
