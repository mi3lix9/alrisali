import "../i18n";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert, Button, Progress, Spinner, Text } from "panelui-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Alert as NativeAlert,
  ScrollView,
  View,
} from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { Screen } from "@/shared/ui/screen";

import { CounterButton } from "../components/counter-button";
import { FeedbackModePicker } from "../components/feedback-mode-picker";
import { useOpenTasbih } from "../hooks/use-open-tasbih";
import type { OpenTasbihNotice } from "../hooks/use-open-tasbih";

const NOTICE_KEY = {
  "target-reached": "open.targetReached",
  "session-saved": "open.sessionSaved",
  "session-failed": "open.sessionFailed",
} as const;

const NOTICE_VARIANT = {
  "target-reached": "success",
  "session-saved": "info",
  "session-failed": "destructive",
} as const;

const Notice = ({ notice }: { notice: OpenTasbihNotice }) => {
  const { t } = useTranslation("tasbih");
  const message = notice ? t(NOTICE_KEY[notice]) : null;

  useEffect(() => {
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);

  return (
    <View className="min-h-14 w-full max-w-80 justify-center">
      {message ? (
        <Alert
          variant={notice ? NOTICE_VARIANT[notice] : "info"}
          accessibilityLiveRegion="polite"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
    </View>
  );
};

/** An Open Tasbih's counter: count, see the target and notes, save, reset. */
export const OpenTasbihScreen = () => {
  const { t } = useTranslation("tasbih");
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasbih, count, notice, tap, saveSession, reset } = useOpenTasbih(id);

  if (tasbih === null) {
    return (
      <Screen>
        <Text muted>{t("open.notFound")}</Text>
      </Screen>
    );
  }

  if (!tasbih || count === null) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  const confirmReset = () =>
    NativeAlert.alert(
      t("open.reset.title", { name: tasbih.name }),
      t("open.reset.message"),
      [
        { text: t("reset.cancel"), style: "cancel" },
        { text: t("reset.confirm"), style: "destructive", onPress: reset },
      ]
    );

  return (
    <>
      <Stack.Screen
        options={{
          title: tasbih.name,
          headerLargeTitle: false,
          headerRight: () => (
            <Button
              variant="ghost"
              size="sm"
              onPress={() =>
                router.push({ pathname: "/tasbih/edit", params: { id } })
              }
            >
              {t("open.edit")}
            </Button>
          ),
        }}
      />
      <ScrollView
        className="bg-background flex-1"
        contentContainerClassName="grow items-center justify-center gap-6 p-6"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text muted>
          {tasbih.target === null
            ? t("open.noTarget")
            : t("open.target", { target: formatNumber(tasbih.target) })}
        </Text>

        <CounterButton count={count} target={tasbih.target} onTap={tap} />

        {tasbih.target === null ? null : (
          <View className="w-full max-w-72">
            <Progress
              value={Math.min(count, tasbih.target)}
              maxValue={tasbih.target}
            />
          </View>
        )}

        <Notice notice={notice} />

        <View className="flex-row gap-3">
          <Button onPress={saveSession} disabled={count === 0}>
            {t("open.saveSession")}
          </Button>
          <Button
            variant="outline"
            onPress={confirmReset}
            disabled={count === 0}
          >
            {t("reset.action")}
          </Button>
        </View>

        {tasbih.notes ? (
          <Text muted className="w-full max-w-80 text-center">
            {tasbih.notes}
          </Text>
        ) : null}

        <FeedbackModePicker />
      </ScrollView>
    </>
  );
};
