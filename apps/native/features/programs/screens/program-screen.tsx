import "../i18n";
import { isProgramAvailable } from "@alrisali/domain/programs";
import type { Act } from "@alrisali/domain/programs";
import { Stack, useLocalSearchParams } from "expo-router";
import { Badge, Card, Spinner, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { SubscriptionActions } from "../components/subscription-actions";
import { useOfficialProgram } from "../data/official-programs";
import { useSubscriptions } from "../data/subscriptions";
import { useDescribe } from "../hooks/use-describe";
import { useHijriToday } from "../hooks/use-hijri-today";

const ActRow = ({ act }: { act: Act }) => {
  const { t } = useTranslation("programs");
  const describe = useDescribe();
  const details = [
    describe.timing(act),
    describe.schedule(act),
    act.detail.type === "prayer"
      ? t("rakahs", { count: act.detail.rakahs })
      : null,
  ].filter((part) => part !== null);

  return (
    <View className="gap-1">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text weight="medium">{act.name[launchLanguage]}</Text>
        {act.detail.type === "regular" ? null : (
          <Badge size="sm" variant="info">
            {t(`types.${act.detail.type}`)}
          </Badge>
        )}
      </View>
      <Text muted size="sm">
        {details.join(" · ")}
      </Text>
    </View>
  );
};

/** One Official Program: what it is, its Acts, and the Subscription controls. */
export const ProgramScreen = () => {
  const { t } = useTranslation("programs");
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const today = useHijriToday();
  const describe = useDescribe();
  const { data: program, isPending } = useOfficialProgram(id);
  const { data: subscriptions = [] } = useSubscriptions();
  const subscription = subscriptions.find(({ programId }) => programId === id);

  if (isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  const inSeason = program ? isProgramAvailable(program, today) : false;
  // Out of season, a Program is shown only to its subscribers.
  if (!program || !(inSeason || subscription)) {
    return (
      <Screen>
        <Text muted>{t("notFound")}</Text>
      </Screen>
    );
  }

  const description = program.description[launchLanguage];
  const season = describe.season(program);

  return (
    <Screen>
      <Stack.Screen options={{ title: program.name[launchLanguage] }} />
      <View className="gap-2">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge size="sm" variant="secondary">
            {t(`category.${program.category}`)}
          </Badge>
          {subscription ? (
            <Badge
              size="sm"
              variant={subscription.paused ? "warning" : "success"}
            >
              {subscription.paused ? t("paused") : t("subscribed")}
            </Badge>
          ) : null}
          {inSeason ? null : (
            <Badge size="sm" variant="outline">
              {t("outOfSeason")}
            </Badge>
          )}
        </View>
        {season ? <Text muted>{season}</Text> : null}
        {description ? <Text>{description}</Text> : null}
      </View>

      <SubscriptionActions program={program} subscription={subscription} />

      <Card>
        <Card.Header>
          <Card.Title>{t("actsTitle")}</Card.Title>
          <Card.Description>{describe.actCount(program)}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          {program.acts.length === 0 ? (
            <Text muted>{t("noActs")}</Text>
          ) : (
            program.acts.map((act) => <ActRow key={act.id} act={act} />)
          )}
        </Card.Content>
      </Card>
    </Screen>
  );
};
