import {
  readHabitCompletionsInsightsSource,
  readHabitsInsightsSource,
} from "@alrisali/db-user/habits";
import { readKhatmahInsightsSource } from "@alrisali/db-user/khatmah";
import { readKhushuInsightsSource } from "@alrisali/db-user/khushu";
import { readMoodCheckInsInsightsSource } from "@alrisali/db-user/mood";
import { readPrayerLogInsightsSource } from "@alrisali/db-user/prayer-log";
import type { InsightsSourceReaders } from "@alrisali/db-user/shared";
import { readDhikrSessionsInsightsSource } from "@alrisali/db-user/tasbih";

import { InsightsScreen } from "@/features/insights";

/** Each feature reads its own records for Insights. */
const INSIGHTS_SOURCE_READERS: InsightsSourceReaders = {
  prayerLogs: readPrayerLogInsightsSource,
  khushu: readKhushuInsightsSource,
  habits: readHabitsInsightsSource,
  habitCompletions: readHabitCompletionsInsightsSource,
  dhikrSessions: readDhikrSessionsInsightsSource,
  moodCheckIns: readMoodCheckInsInsightsSource,
  khatmahs: readKhatmahInsightsSource,
};

const InsightsRoute = () => (
  <InsightsScreen readers={INSIGHTS_SOURCE_READERS} />
);

export default InsightsRoute;
