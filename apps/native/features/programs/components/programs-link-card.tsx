import "../i18n";
import { availablePrograms, unseenPrograms } from "@alrisali/domain/programs";
import { router } from "expo-router";
import { Badge, Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useOfficialPrograms } from "../data/official-programs";
import { useSeenProgramIds } from "../data/seen-programs";
import { useSubscriptions } from "../data/subscriptions";
import { useHijriToday } from "../hooks/use-hijri-today";

/**
 * The Worship tab's way into Official Programs, with the Subscription count
 * and a badge for available Programs the Believer has not opened yet.
 */
export const ProgramsLinkCard = () => {
  const { t } = useTranslation("programs");
  const today = useHijriToday();
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: programs = [] } = useOfficialPrograms();
  const { data: seen } = useSeenProgramIds();
  const unseen = seen
    ? unseenPrograms(availablePrograms(programs, today), seen).length
    : 0;

  return (
    <Card>
      <Card.Header>
        <View className="flex-row flex-wrap items-center gap-2">
          <Card.Title>{t("link.title")}</Card.Title>
          {unseen > 0 ? (
            <Badge size="sm" variant="info">
              {t("newCount", { count: unseen })}
            </Badge>
          ) : null}
        </View>
        <Card.Description>{t("link.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="items-start gap-3">
        <Text muted size="sm">
          {t("link.subscribed", { count: subscriptions.length })}
        </Text>
        <Button
          variant="outline"
          testID="programs-open"
          onPress={() => router.push("/worship/programs")}
        >
          {t("link.open")}
        </Button>
      </Card.Content>
    </Card>
  );
};
