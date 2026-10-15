import "../i18n";
import type { PersonalProgram, Subscription } from "@alrisali/domain/programs";
import { router } from "expo-router";
import { Badge, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { SubscriptionActions } from "./subscription-actions";

/** A Personal Program in a list: tap to see it; subscribe or pause in place. */
export const PersonalProgramCard = ({
  program,
  subscription,
}: {
  program: PersonalProgram;
  subscription: Subscription | undefined;
}) => {
  const { t } = useTranslation("programs");

  return (
    <Card>
      <Pressable
        accessibilityRole="link"
        onPress={() =>
          router.push({
            pathname: "/worship/programs/personal/[id]",
            params: { id: program.id },
          })
        }
      >
        <Card.Header>
          <Card.Title>{program.name}</Card.Title>
          {program.description ? (
            <Card.Description numberOfLines={2}>
              {program.description}
            </Card.Description>
          ) : null}
        </Card.Header>
        <Card.Content className="gap-2">
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
          <Text muted size="sm">
            {t("acts", { count: program.acts.length })}
          </Text>
        </Card.Content>
      </Pressable>
      <Card.Footer>
        <SubscriptionActions
          program={{ id: program.id, kind: "personal" }}
          subscription={subscription}
        />
      </Card.Footer>
    </Card>
  );
};
