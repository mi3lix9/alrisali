import { PrayerLogCard } from "@/features/prayer-log";
import { PrayerTimesScreen } from "@/features/prayer-times";
import { QiblaToolbarButton } from "@/features/qibla";

const PrayerRoute = () => (
  <>
    <QiblaToolbarButton />
    <PrayerTimesScreen>
      <PrayerLogCard />
    </PrayerTimesScreen>
  </>
);

export default PrayerRoute;
