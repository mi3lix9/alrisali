import "../i18n";
import type { Act } from "@alrisali/domain/programs";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Badge, Button, Card, Spinner, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { Screen } from "@/shared/ui/screen";

import { ActRow } from "../components/act-row";
import { ActSheet } from "../components/act-sheet";
import { SubscriptionActions } from "../components/subscription-actions";
import {
  usePersonalProgram,
  useRemovePersonalProgram,
} from "../data/personal-programs";
import { useSubscriptions } from "../data/subscriptions";

/** One Personal Program: its Acts, the Subscription controls, edit and delete. */
export const PersonalProgramScreen = () => {
  const { t } = useTranslation("programs");
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const { data: program, isPending } = usePersonalProgram(id);
  const { data: subscriptions = [] } = useSubscriptions();
  const subscription = subscriptions.find(({ programId }) => programId === id);
  const remove = useRemovePersonalProgram();
  const [opened, setOpened] = useState<Act | null>(null);

  if (isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }
  if (!program) {
    return (
      <Screen>
        <Text muted>{t("personal.notFound")}</Text>
      </Screen>
    );
  }

  const confirmDelete = () =>
    Alert.alert(
      t("personal.confirmDelete.title"),
      t("personal.confirmDelete.message"),
      [
        { text: t("personal.confirmDelete.cancel"), style: "cancel" },
        {
          text: t("personal.confirmDelete.confirm"),
          style: "destructive",
          onPress: () =>
            remove.mutate(program.id, { onSuccess: () => router.back() }),
        },
      ]
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: program.name }} />
      <View className="gap-2">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge size="sm" variant="secondary">
            {t("personal.badge")}
          </Badge>
          {subscription ? (
            <Badge
              size="sm"
              variant={subscription.paused ? "warning" : "success"}
            >
              {subscription.paused ? t("paused") : t("subscribed")}
            </Badge>
          ) : null}
        </View>
        {program.description ? <Text>{program.description}</Text> : null}
      </View>

      <SubscriptionActions
        program={{ id: program.id, kind: "personal" }}
        subscription={subscription}
      />

      <Card>
        <Card.Header>
          <Card.Title>{t("actsTitle")}</Card.Title>
          <Card.Description>
            {t("acts", { count: program.acts.length })}
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          {program.acts.length === 0 ? (
            <Text muted>{t("builder.noActs")}</Text>
          ) : (
            program.acts.map((act) => (
              <ActRow key={act.id} act={act} onOpen={() => setOpened(act)} />
            ))
          )}
        </Card.Content>
      </Card>

      <View className="flex-row flex-wrap gap-2">
        <Button
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/worship/programs/build",
              params: { id: program.id },
            })
          }
        >
          {t("personal.edit")}
        </Button>
        <Button
          variant="ghost"
          loading={remove.isPending}
          onPress={confirmDelete}
        >
          {t("personal.delete")}
        </Button>
      </View>
      {remove.isError ? (
        <Text className="text-destructive" accessibilityLiveRegion="polite">
          {t("saveError")}
        </Text>
      ) : null}
      <ActSheet act={opened} onClose={() => setOpened(null)} />
    </Screen>
  );
};
