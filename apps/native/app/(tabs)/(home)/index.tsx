import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { ContinueSupplicationTile } from "@/features/books";
import { HijriTodayCard } from "@/features/calendar";
import { CompanionCard } from "@/features/companion";
import { ContinueRow } from "@/features/continue";
import { TodaysWorshipCard } from "@/features/daily-content";
import { UpcomingGatheringsCard } from "@/features/gatherings";
import { InsightsLinkCard } from "@/features/insights";
import { ContinueKhatmahTile } from "@/features/khatmah";
import { MoodCheckInCard } from "@/features/mood";
import { PrayerLogQuickTicks, PrayerStreakTile } from "@/features/prayer-log";
import {
  NextPrayerCard,
  useAfterMaghrib,
  useTonightHijriDate,
} from "@/features/prayer-times";
import { QiblaTile } from "@/features/qibla";
import { ContinueReadingTile, VerseOfTheDayCard } from "@/features/quran";
import { AlertHealthBanner } from "@/features/reminders";
import { HomeShortcutsCard } from "@/features/shortcuts";
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
  const afterMaghrib = useAfterMaghrib();
  const tonight = useTonightHijriDate();

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
        <AlertHealthBanner />
        <NextPrayerCard />
        <WidgetRow>
          <HijriTodayCard compact tonight={tonight} />
          <PrayerStreakTile />
        </WidgetRow>
        <PrayerLogQuickTicks showStreak={false} />
        <MoodCheckInCard />
        <ContinueRow>
          <ContinueReadingTile />
          <ContinueSupplicationTile />
          <ContinueKhatmahTile />
        </ContinueRow>
        <TodaysWorshipCard afterMaghrib={afterMaghrib} />
        <HomeShortcutsCard />
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
