import "../i18n";
import { SALAH } from "@alrisali/domain/reminders";
import { Button, Card, Item, Text } from "panelui-native";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { QuietHours } from "../components/quiet-hours";
import { ReminderRow } from "../components/reminder-row";
import { ReminderSheet } from "../components/reminder-sheet";
import {
  useReminderSettings,
  useUpdateReminderSettings,
} from "../data/reminder-settings";
import { useNotificationAccess } from "../hooks/use-notification-permission";
import { ruleOf } from "../utils/reminder-key";
import type { ReminderKey } from "../utils/reminder-key";

/**
 * Each Salah's Reminder and Imsak's, each shown as what it will do and
 * opening its sheet, and the quiet hours.
 */
export const RemindersScreen = () => {
  const { t } = useTranslation("reminders");
  const { data: believer } = useBelieverSettings();
  const { data: settings } = useReminderSettings();
  const { mutate: update } = useUpdateReminderSettings();
  const { access, allow, allowExactAlarms } = useNotificationAccess();
  const [selected, setSelected] = useState<ReminderKey>("fajr");
  const [open, setOpen] = useState(false);

  const choose = (key: ReminderKey) => {
    setSelected(key);
    setOpen(true);
  };

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
          <Item.Group>
            {SALAH.map((salah, index) => (
              <Fragment key={salah}>
                {index > 0 ? <Item.Separator /> : null}
                <ReminderRow
                  reminderKey={salah}
                  rule={ruleOf(settings, salah)}
                  onPress={() => choose(salah)}
                />
              </Fragment>
            ))}
          </Item.Group>
          <Text weight="semibold" size="lg">
            {t("screen.imsakTitle")}
          </Text>
          <Item.Group>
            <ReminderRow
              reminderKey="imsak"
              rule={settings.imsak}
              onPress={() => choose("imsak")}
            />
          </Item.Group>
          <Text size="sm" muted>
            {t("screen.imsakDescription")}
          </Text>
          <QuietHours
            quietHours={settings.quietHours}
            onChange={(quietHours) => update({ quietHours })}
          />
          <ReminderSheet
            reminderKey={selected}
            open={open}
            onOpenChange={setOpen}
          />
        </>
      ) : null}
    </Screen>
  );
};
