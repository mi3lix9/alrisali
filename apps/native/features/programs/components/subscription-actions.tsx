import "../i18n";
import { SubscriptionRefusedError } from "@alrisali/domain/programs";
import type {
  SubscribedProgramKind,
  Subscription,
} from "@alrisali/domain/programs";
import { Button, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import {
  useSetSubscriptionPaused,
  useSubscribe,
  useUnsubscribe,
} from "../data/subscriptions";
import { useExplainRefusal } from "../hooks/use-explain-refusal";

/**
 * Subscribe, or pause, resume and unsubscribe. A refused Subscription is
 * explained in a dialog that says which limit was reached and what to do.
 */
export const SubscriptionActions = ({
  program,
  subscription,
}: {
  program: { id: string; kind: SubscribedProgramKind };
  subscription: Subscription | undefined;
}) => {
  const { t } = useTranslation("programs");
  const subscribe = useSubscribe();
  const setPaused = useSetSubscriptionPaused();
  const unsubscribe = useUnsubscribe();
  const explainRefusal = useExplainRefusal();
  const busy =
    subscribe.isPending || setPaused.isPending || unsubscribe.isPending;
  const failed =
    (subscribe.isError &&
      !(subscribe.error instanceof SubscriptionRefusedError)) ||
    setPaused.isError ||
    unsubscribe.isError;

  const confirmUnsubscribe = () =>
    Alert.alert(t("unsubscribe.title"), t("unsubscribe.message"), [
      { text: t("unsubscribe.cancel"), style: "cancel" },
      {
        text: t("unsubscribe.confirm"),
        style: "destructive",
        onPress: () => unsubscribe.mutate(program.id),
      },
    ]);

  return (
    <View className="gap-2">
      {subscription ? (
        <View className="flex-row flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onPress={() =>
              setPaused.mutate({
                programId: program.id,
                paused: !subscription.paused,
              })
            }
          >
            {subscription.paused ? t("actions.resume") : t("actions.pause")}
          </Button>
          <Button variant="ghost" disabled={busy} onPress={confirmUnsubscribe}>
            {t("actions.unsubscribe")}
          </Button>
        </View>
      ) : (
        <Button
          disabled={busy}
          onPress={() =>
            subscribe.mutate(program, {
              onError: (error) => explainRefusal(error),
            })
          }
        >
          {t("actions.subscribe")}
        </Button>
      )}
      {failed ? (
        <Text className="text-destructive" accessibilityLiveRegion="polite">
          {t("saveError")}
        </Text>
      ) : null}
    </View>
  );
};
