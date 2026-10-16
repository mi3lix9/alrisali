import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { HijriTodayCard } from "@/features/calendar";
import { CompanionCard } from "@/features/companion";
import { DailyContentCard } from "@/features/daily-content";
import { UpcomingGatheringsCard } from "@/features/gatherings";
import { InsightsLinkCard } from "@/features/insights";
import { MoodCheckInCard } from "@/features/mood";
import { PrayerLogQuickTicks, PrayerStreakTile } from "@/features/prayer-log";
import { NextPrayerCard } from "@/features/prayer-times";
import { QiblaTile } from "@/features/qibla";
import { ContinueReadingCard, VerseOfTheDayCard } from "@/features/quran";
import { Screen } from "@/shared/ui/screen";
import { WidgetRow } from "@/shared/ui/widget";

// SF Symbols exist only on iOS; elsewhere the button shows its label.
const settingsIcon =
  Platform.OS === "ios" ? ({ icon: "gearshape" } as const) : {};
const accountIcon =
  Platform.OS === "ios" ? ({ icon: "person.crop.circle" } as const) : {};

// Home is the widget grid (prototype variant B): full-width cards and pairs
// of half-width tiles, today's Salah first, then what the Believer does
// today, then reading, then the rest. Account sits at the header's leading
// edge and Settings at its trailing edge.
const HomeRoute = () => {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          {...accountIcon}
          onPress={() => router.push("/account")}
        >
          {t("account")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          {...settingsIcon}
          onPress={() => router.push("/settings")}
        >
          {t("settings")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Screen>
        <NextPrayerCard />
        <WidgetRow>
          <HijriTodayCard compact />
          <PrayerStreakTile />
        </WidgetRow>
        <PrayerLogQuickTicks showStreak={false} />
        <MoodCheckInCard />
        <DailyContentCard />
        <ContinueReadingCard />
        <VerseOfTheDayCard />
        <CompanionCard />
        <UpcomingGatheringsCard />
        <WidgetRow>
          <InsightsLinkCard compact />
          <QiblaTile />
        </WidgetRow>
      </Screen>
    </>
  );
};

export default HomeRoute;
