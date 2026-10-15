import "../i18n";
import {
  previousOnboardingStep,
  stepPosition,
} from "@alrisali/domain/onboarding";
import type { OnboardingStep } from "@alrisali/domain/onboarding";
import { reloadAppAsync } from "expo";
import { Button, Progress, Text } from "panelui-native";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { events } from "@/shared/lib/events";
import { launchLanguage, usePreferences } from "@/shared/lib/preferences";

import { LanguageStep } from "../components/language-step";
import { NotificationsStep } from "../components/notifications-step";
import { useFirstRun } from "../data/first-run";

interface OnboardingScreenProps {
  /** Other features' cards for their steps, composed by the route. */
  location: ReactNode;
  calculationMethod: ReactNode;
  messageStyle: ReactNode;
  signIn: ReactNode;
}

/**
 * The first run: language, location, Calculation Method, Message Style and
 * notifications, then sign in or continue as a Guest. Every choice is saved
 * as it is made, so leaving the app midway resumes at the same step.
 */
export const OnboardingScreen = ({
  location,
  calculationMethod,
  messageStyle,
  signIn,
}: OnboardingScreenProps) => {
  const { t } = useTranslation("onboarding");
  const { progress, advance, goTo } = useFirstRun();
  const language = usePreferences((state) => state.language);
  const { data: believer } = useBelieverSettings();

  // Signing in from the account step finishes the first run.
  useEffect(() => events.on("SignedIn", () => advance("account")), [advance]);

  if (progress.done) {
    return null;
  }
  const { step } = progress;
  const position = stepPosition(step);
  const previous = previousOnboardingStep(step);

  const content: Record<OnboardingStep, ReactNode> = {
    language: <LanguageStep />,
    location,
    calculationMethod,
    messageStyle,
    notifications: <NotificationsStep />,
    account: signIn,
  };

  const next = () => {
    advance(step);
    // The layout direction is fixed at launch: a new language relaunches,
    // and the stored progress resumes at the next step.
    if (step === "language" && language !== launchLanguage) {
      void reloadAppAsync();
    }
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4"
        keyboardShouldPersistTaps="handled"
      >
        <Progress
          value={position.number}
          maxValue={position.of}
          label={t("position", position)}
        />
        <Text
          size="2xl"
          weight="bold"
          accessibilityRole="header"
          testID="onboarding-title"
        >
          {t(`${step}.title`)}
        </Text>
        <Text muted>{t(`${step}.description`)}</Text>
        {content[step]}
      </ScrollView>
      <View className="flex-row gap-3 p-4">
        {previous ? (
          <Button variant="ghost" onPress={() => goTo(previous)}>
            {t("back")}
          </Button>
        ) : null}
        {step === "account" ? (
          <Button
            className="flex-1"
            variant="outline"
            testID="onboarding-guest"
            onPress={() => advance(step)}
          >
            {t("account.guest")}
          </Button>
        ) : (
          <Button
            className="flex-1"
            testID="onboarding-continue"
            onPress={next}
          >
            {step === "location" && !believer?.location
              ? t("skip")
              : t("continue")}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};
