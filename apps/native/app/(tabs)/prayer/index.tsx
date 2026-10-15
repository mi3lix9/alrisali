import { PrayerLogCard } from "@/features/prayer-log";
import { PrayerTimesScreen } from "@/features/prayer-times";

const PrayerRoute = () => (
  <PrayerTimesScreen>
    <PrayerLogCard />
  </PrayerTimesScreen>
);

export default PrayerRoute;
