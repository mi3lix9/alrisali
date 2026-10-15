import "../i18n";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications";
import { Button, Card, Item, Switch, Text } from "panelui-native";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import { orpc } from "@/shared/lib/orpc";
import { usePreferences } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { useAnnouncementsPreference } from "../data/announcements-preference";
import { usePushToken } from "../hooks/use-push-device";

const PERMISSION_QUERY_KEY = ["announcements", "permission"];

/** The opt-out and the inbox of Announcements this device received. */
export const AnnouncementsScreen = () => {
  const { t } = useTranslation("announcements");
  const queryClient = useQueryClient();
  const language = usePreferences((state) => state.language);
  const { enabled, setEnabled } = useAnnouncementsPreference();
  const { data: permission } = useQuery({
    queryKey: PERMISSION_QUERY_KEY,
    queryFn: getPermissionsAsync,
  });
  const { data: pushToken } = usePushToken();
  const inbox = useQuery(
    orpc.announcements.inbox.queryOptions({
      input: pushToken ? { pushToken } : skipToken,
    })
  );
  const sentAt = new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const allow = async () => {
    await (permission?.canAskAgain
      ? requestPermissionsAsync()
      : Linking.openSettings());
    await queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  return (
    <Screen>
      <Card>
        <Card.Content className="gap-4">
          <Item size="sm">
            <Item.Content>
              <Item.Title>{t("screen.receive")}</Item.Title>
              <Item.Description>{t("screen.receiveHint")}</Item.Description>
            </Item.Content>
            <Item.Actions>
              <Switch
                label={t("screen.receive")}
                value={enabled}
                onValueChange={setEnabled}
              />
            </Item.Actions>
          </Item>
          {enabled && permission && !permission.granted ? (
            <>
              <Text>{t("screen.denied")}</Text>
              <Button onPress={() => allow()}>
                {permission.canAskAgain
                  ? t("screen.allow")
                  : t("screen.openSettings")}
              </Button>
            </>
          ) : null}
          {enabled && permission?.granted && pushToken === null ? (
            <Text muted>{t("screen.unavailable")}</Text>
          ) : null}
        </Card.Content>
      </Card>
      <Text weight="semibold" size="lg">
        {t("screen.inbox")}
      </Text>
      {inbox.isError ? <Text muted>{t("screen.error")}</Text> : null}
      {inbox.data?.announcements.length ? (
        <Card>
          <Card.Content>
            <Item.Group>
              {inbox.data.announcements.map((announcement, index) => (
                <Fragment key={announcement.id}>
                  {index > 0 && <Item.Separator />}
                  <Item size="sm">
                    <Item.Content>
                      <Item.Title>{announcement.title}</Item.Title>
                      <Item.Description>{announcement.body}</Item.Description>
                      <Text muted size="sm">
                        {sentAt.format(announcement.sentAt)}
                      </Text>
                    </Item.Content>
                  </Item>
                </Fragment>
              ))}
            </Item.Group>
          </Card.Content>
        </Card>
      ) : null}
      {!inbox.isError && !inbox.data?.announcements.length ? (
        <Text muted>{t("screen.empty")}</Text>
      ) : null}
    </Screen>
  );
};
