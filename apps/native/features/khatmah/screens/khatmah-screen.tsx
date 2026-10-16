import "../i18n";
import { khatmahSessionRows } from "@alrisali/domain/khatmah";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Card, Spinner, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";
import { Screen } from "@/shared/ui/screen";

import { ReminderField } from "../components/reminder-field";
import { SessionList } from "../components/session-list";
import { useRemoveKhatmah, useSetKhatmahReminder } from "../data/khatmah";
import { useActiveKhatmah } from "../hooks/use-active-khatmah";
import type { ActiveKhatmah } from "../hooks/use-active-khatmah";
import { useAyahLabel } from "../utils/use-ayah-label";
import { useDayLabels } from "../utils/use-day-labels";

const StatusCard = ({ active }: { active: ActiveKhatmah }) => {
  const { t } = useTranslation("khatmah");
  const ayahLabel = useAyahLabel();
  const dayLabels = useDayLabels();
  const { status } = active;
  const { current } = status;

  let standing = t("status.onTrack");
  if (status.state === "ahead") {
    standing = t("status.ahead", { count: status.sessions });
  } else if (status.state === "behind") {
    standing = t("status.behind", { count: status.sessions });
  }

  return (
    <Card testID="khatmah-status">
      <Card.Header>
        <Card.Description>{t("status.today")}</Card.Description>
        {current ? (
          <Card.Title testID="khatmah-portion">
            {t("status.portion", {
              from: ayahLabel(current.from),
              to: ayahLabel(current.to),
            })}
          </Card.Title>
        ) : null}
        {current ? (
          <Card.Description>
            {t("status.pagesInPortion", { count: current.pages })}
          </Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content className="gap-1">
        <Text weight="semibold" testID="khatmah-standing">
          {standing}
        </Text>
        <Text size="sm" muted>
          {t("status.sessionsDone", {
            done: formatNumber(status.done),
            total: formatNumber(status.total),
          })}
        </Text>
        <Text size="sm" muted>
          {t("status.pagesRead", {
            read: formatNumber(status.pagesRead),
            total: formatNumber(604),
          })}
        </Text>
        {status.estimatedFinish ? (
          <Text size="sm" muted testID="khatmah-finish">
            {t("status.finish", dayLabels(status.estimatedFinish))}
          </Text>
        ) : null}
      </Card.Content>
      {current ? (
        <Card.Footer>
          <Button
            testID="khatmah-open-portion"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/quran",
                params: { ayah: current.from },
              })
            }
          >
            {t("status.open")}
          </Button>
        </Card.Footer>
      ) : null}
    </Card>
  );
};

const ActiveKhatmahView = ({ active }: { active: ActiveKhatmah }) => {
  const { t } = useTranslation("khatmah");
  const today = useToday();
  const { mutate: setReminder } = useSetKhatmahReminder();
  const { mutate: remove } = useRemoveKhatmah();
  const { khatmah, logs } = active;

  const confirmRemove = () =>
    Alert.alert(
      t("manage.removeConfirmTitle"),
      t("manage.removeConfirmDescription"),
      [
        { text: t("manage.cancel"), style: "cancel" },
        {
          text: t("manage.confirmRemove"),
          style: "destructive",
          onPress: () => remove(khatmah.id),
        },
      ]
    );

  return (
    <Screen>
      <StatusCard active={active} />
      <ReminderField
        value={khatmah.reminderAt}
        onChange={(reminderAt) => setReminder({ id: khatmah.id, reminderAt })}
      />
      <Text weight="semibold">{t("sessions.title")}</Text>
      <SessionList
        rows={khatmahSessionRows(khatmah, logs, today)}
        today={today}
      />
      <Button testID="khatmah-remove" variant="outline" onPress={confirmRemove}>
        {t("manage.remove")}
      </Button>
    </Screen>
  );
};

/**
 * The Khatmah (prototype variant A): a status card with today's portion,
 * whether the Believer is on track, ahead or behind and when they will
 * finish, the daily reminder, and every session with its date. Without a
 * Khatmah it invites the Believer to start one.
 */
export const KhatmahScreen = () => {
  const { t } = useTranslation("khatmah");
  const { id } = useLocalSearchParams<{ id?: string }>();
  const active = useActiveKhatmah(id);

  let body = (
    <View className="bg-background flex-1 items-center justify-center">
      <Spinner />
    </View>
  );
  if (active) {
    body = <ActiveKhatmahView active={active} />;
  } else if (active === null) {
    body = (
      <Screen>
        <Card>
          <Card.Header>
            <Card.Title>{t("empty.title")}</Card.Title>
            <Card.Description>{t("empty.description")}</Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button
              testID="khatmah-new"
              onPress={() => router.push("/khatmah-new")}
            >
              {t("empty.start")}
            </Button>
          </Card.Footer>
        </Card>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      {active ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button onPress={() => router.push("/khatmah-new")}>
            {t("manage.startOver")}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}
      {body}
    </>
  );
};
