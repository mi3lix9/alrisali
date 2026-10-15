import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { HijriTodayCard } from "@/features/calendar";
import { CompanionCard } from "@/features/companion";
import { DailyContentCard } from "@/features/daily-content";
import { UpcomingGatheringsCard } from "@/features/gatherings";
import { InsightsLinkCard } from "@/features/insights";
import { PrayerLogQuickTicks } from "@/features/prayer-log";
import { NextPrayerCard } from "@/features/prayer-times";
import { ContinueReadingCard, VerseOfTheDayCard } from "@/features/quran";
import { Screen } from "@/shared/ui/screen";

// SF Symbols exist only on iOS; elsewhere the button shows its label.
const settingsIcon =
  Platform.OS === "ios" ? ({ icon: "gearshape" } as const) : {};
const accountIcon =
  Platform.OS === "ios" ? ({ icon: "person.crop.circle" } as const) : {};

const HomeRoute = () => {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          {...accountIcon}
          onPress={() => router.push("/account")}
        >
          {t("account")}
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          {...settingsIcon}
          onPress={() => router.push("/settings")}
        >
          {t("settings")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Screen>
        <NextPrayerCard />
        <HijriTodayCard />
        <UpcomingGatheringsCard />
        <ContinueReadingCard />
        <PrayerLogQuickTicks />
        <CompanionCard />
        <InsightsLinkCard />
        <DailyContentCard />
        <VerseOfTheDayCard />
      </Screen>
    </>
  );
};

export default HomeRoute;
