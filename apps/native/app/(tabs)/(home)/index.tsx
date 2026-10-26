import { router } from "expo-router";
import { useTranslation } from "react-i18next";

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
import { HeaderButton } from "@/shared/ui/header-button";
import { Screen } from "@/shared/ui/screen";
import { WidgetRow } from "@/shared/ui/widget";

// Home is the widget grid (prototype variant B): full-width cards and pairs
// of half-width tiles, today's Salah first, then what the Believer does
// today, then reading, then the rest. Account sits at the header's leading
// edge and Settings at its trailing edge.
const HomeRoute = () => {
  const { t } = useTranslation();

  return (
    <>
      <HeaderButton
        placement="left"
        label={t("account")}
        symbol="person.crop.circle"
        onPress={() => router.push("/account")}
      />
      <HeaderButton
        placement="right"
        label={t("settings")}
        symbol="gearshape"
        onPress={() => router.push("/settings")}
      />
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
