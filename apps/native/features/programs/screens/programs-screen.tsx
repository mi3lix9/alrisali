import "../i18n";
import {
  isProgramAvailable,
  SUBSCRIPTION_LIMITS,
} from "@alrisali/domain/programs";
import { router, Stack } from "expo-router";
import { Button, Spinner, Text } from "panelui-native";
import { PlusIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Screen } from "@/shared/ui/screen";

import { PersonalProgramCard } from "../components/personal-program-card";
import { ProgramCard } from "../components/program-card";
import { useOfficialPrograms } from "../data/official-programs";
import { usePersonalPrograms } from "../data/personal-programs";
import { useSeenProgramIds } from "../data/seen-programs";
import { useSubscriptions } from "../data/subscriptions";
import { useHijriToday } from "../hooks/use-hijri-today";

/**
 * Programs: the Believer's subscribed Official ones first (out-of-season
 * ones stay, so they can be paused or left), then their Personal Programs,
 * then the Official ones available today. Seasonal ones show only within
 * their Hijri window.
 */
export const ProgramsScreen = () => {
  const { t } = useTranslation("programs");
  const today = useHijriToday();
  const programs = useOfficialPrograms();
  const { data: personal = [] } = usePersonalPrograms();
  const { data: subscriptions = [] } = useSubscriptions();
  // Until it loads, no Program is badged rather than all of them.
  const { data: seen } = useSeenProgramIds();
  const unseen = (id: string) => seen !== undefined && !seen.has(id);

  const title = <Stack.Screen options={{ title: t("title") }} />;

  if (programs.isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        {title}
        <Spinner />
      </View>
    );
  }

  const all = programs.data ?? [];
  const subscriptionOf = (id: string) =>
    subscriptions.find(({ programId }) => programId === id);
  const mine = all.filter(({ id }) => subscriptionOf(id));
  const available = all.filter(
    (program) =>
      !subscriptionOf(program.id) && isProgramAvailable(program, today)
  );

  return (
    <Screen>
      {title}
      <Text muted>{t("limits", { total: SUBSCRIPTION_LIMITS.total })}</Text>
      {programs.isError ? (
        <Text className="text-destructive">{t("loadError")}</Text>
      ) : null}

      {mine.length > 0 ? (
        <View className="gap-3">
          <Text size="lg" weight="semibold" accessibilityRole="header">
            {t("mine")}
          </Text>
          {mine.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              subscription={subscriptionOf(program.id)}
              inSeason={isProgramAvailable(program, today)}
              unseen={unseen(program.id)}
            />
          ))}
        </View>
      ) : null}

      <View className="gap-3">
        <Text size="lg" weight="semibold" accessibilityRole="header">
          {t("personal.title")}
        </Text>
        <Text muted>
          {personal.length === 0
            ? t("personal.none")
            : t("personal.description")}
        </Text>
        {personal.map((program) => (
          <PersonalProgramCard
            key={program.id}
            program={program}
            subscription={subscriptionOf(program.id)}
          />
        ))}
        <Button
          variant="outline"
          startContent={<PlusIcon size={18} />}
          onPress={() => router.push("/worship/programs/build")}
        >
          {t("personal.build")}
        </Button>
      </View>

      <View className="gap-3">
        <Text size="lg" weight="semibold" accessibilityRole="header">
          {t("available")}
        </Text>
        {available.length === 0 ? (
          <Text muted>{t("noneAvailable")}</Text>
        ) : (
          available.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              subscription={undefined}
              inSeason
              unseen={unseen(program.id)}
            />
          ))
        )}
      </View>
    </Screen>
  );
};
