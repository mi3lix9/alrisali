import "../i18n";
import { khatmahSessionRows } from "@alrisali/domain/khatmah";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Card, Spinner, Text } from "panelui-native";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";
import { HeaderButton } from "@/shared/ui/header-button";
import { Screen } from "@/shared/ui/screen";

import { CelebrationCard } from "../components/celebration-card";
import { CompletedHistory } from "../components/completed-history";
import { ReminderField } from "../components/reminder-field";
import { RescheduleSheet } from "../components/reschedule-sheet";
import { SessionList } from "../components/session-list";
import { useRemoveKhatmah, useSetKhatmahReminder } from "../data/khatmah";
import { useActiveKhatmah } from "../hooks/use-active-khatmah";
import type { ActiveKhatmah } from "../hooks/use-active-khatmah";
import { useAyahLabel } from "../utils/use-ayah-label";
import { useDayLabels } from "../utils/use-day-labels";

const StatusCard = ({
  active,
  completionActions,
}: {
  active: ActiveKhatmah;
  completionActions?: ReactNode;
}) => {
  const { t } = useTranslation("khatmah");
  const { t: tProgress } = useTranslation("khatmahProgress");
  const [rescheduling, setRescheduling] = useState(false);
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
      {!current && completionActions ? (
        <Card.Footer>{completionActions}</Card.Footer>
      ) : null}
      {current ? (
        <Card.Footer className="flex-col gap-2">
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
          {status.state === "behind" ? (
            <Button
              testID="khatmah-reschedule"
              variant="outline"
              onPress={() => setRescheduling(true)}
            >
              {tProgress("reschedule.action")}
            </Button>
          ) : null}
        </Card.Footer>
      ) : null}
      <RescheduleSheet
        active={active}
        open={rescheduling}
        onClose={() => setRescheduling(false)}
      />
    </Card>
  );
};

const ActiveKhatmahView = ({
  active,
  completionActions,
  shareAction,
}: {
  active: ActiveKhatmah;
  completionActions?: ReactNode;
  shareAction?: ((khatmahId: string) => ReactNode) | undefined;
}) => {
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

  if (active.status.state === "finished") {
    return (
      <Screen>
        <CelebrationCard active={active} />
        {completionActions}
        {shareAction?.(khatmah.id)}
        <CompletedHistory />
        <Button
          testID="khatmah-remove"
          variant="outline"
          onPress={confirmRemove}
        >
          {t("manage.remove")}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusCard active={active} completionActions={completionActions} />
      {shareAction?.(khatmah.id)}
      <ReminderField
        value={khatmah.reminderAt}
        onChange={(reminderAt) => setReminder({ id: khatmah.id, reminderAt })}
      />
      <Text weight="semibold">{t("sessions.title")}</Text>
      <SessionList
        rows={khatmahSessionRows(khatmah, logs, today)}
        today={today}
      />
      <CompletedHistory />
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
export const KhatmahScreen = ({
  completionActions,
  shareAction,
}: {
  /** Shown on the status card once every session is done, composed by the route. */
  completionActions?: ReactNode;
  /** Shares a link to this Khatmah (composed by the route). */
  shareAction?: ((khatmahId: string) => ReactNode) | undefined;
}) => {
  const { t } = useTranslation("khatmah");
  const { id } = useLocalSearchParams<{ id?: string }>();
  const active = useActiveKhatmah(id);

  let body = (
    <View className="bg-background flex-1 items-center justify-center">
      <Spinner />
    </View>
  );
  if (active) {
    body = (
      <ActiveKhatmahView
        active={active}
        completionActions={completionActions}
        shareAction={shareAction}
      />
    );
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
        <CompletedHistory />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      {active ? (
        <HeaderButton
          placement="right"
          label={t("manage.startOver")}
          symbol="arrow.counterclockwise"
          onPress={() => router.push("/khatmah-new")}
        />
      ) : null}
      {body}
    </>
  );
};
