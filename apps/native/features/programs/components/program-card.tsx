import "../i18n";
import type { OfficialProgram, Subscription } from "@alrisali/domain/programs";
import { router } from "expo-router";
import { Badge, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { useDescribe } from "../hooks/use-describe";
import { SubscriptionActions } from "./subscription-actions";

/** A Program in a list: tap to see its Acts; subscribe or pause in place. */
export const ProgramCard = ({
  program,
  subscription,
  inSeason,
  unseen,
}: {
  program: OfficialProgram;
  subscription: Subscription | undefined;
  inSeason: boolean;
  /** Not opened yet: carries a "new" badge. */
  unseen: boolean;
}) => {
  const { t } = useTranslation("programs");
  const describe = useDescribe();
  const season = describe.season(program);
  const description = program.description[launchLanguage];

  return (
    <Card>
      <Pressable
        accessibilityRole="link"
        onPress={() =>
          router.push({
            pathname: "/worship/programs/[id]",
            params: { id: program.id },
          })
        }
      >
        <Card.Header>
          <Card.Title>{program.name[launchLanguage]}</Card.Title>
          {description ? (
            <Card.Description numberOfLines={2}>{description}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Content className="gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            {unseen ? (
              <Badge size="sm" variant="info">
                {t("new")}
              </Badge>
            ) : null}
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
          <Text muted size="sm">
            {[season, describe.actCount(program)]
              .filter((part) => part !== null)
              .join(" · ")}
          </Text>
        </Card.Content>
      </Pressable>
      <Card.Footer>
        <SubscriptionActions program={program} subscription={subscription} />
      </Card.Footer>
    </Card>
  );
};
