import type { Salah } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Button, Text } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

/** What the route offers once a daily Salah is complete (e.g. its taqibat). */
export type CompletionActions = (salah: Salah) => ReactNode;

interface SalahCompletionProps {
  /** The daily Salah just prayed, or null for any other Salah. */
  salah: Salah | null;
  actions?: CompletionActions | undefined;
}

/** The Salah is complete: the route's follow-ups, then Done closes the assistant. */
export const SalahCompletion = ({ salah, actions }: SalahCompletionProps) => {
  const { t } = useTranslation("prayer-assistant");

  return (
    <View className="bg-background flex-1 items-center justify-center gap-6 p-4">
      <Text size="3xl" weight="bold" className="text-center">
        {t("completion.title")}
      </Text>
      {salah && actions ? (
        <View className="flex-row flex-wrap justify-center gap-3">
          {actions(salah)}
        </View>
      ) : null}
      <Button testID="prayer-assistant-done" onPress={() => router.back()}>
        {t("completion.done")}
      </Button>
    </View>
  );
};
