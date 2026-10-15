import { PrayerTimesScreen } from "@/features/prayer-times";
import { QiblaToolbarButton } from "@/features/qibla";

const PrayerRoute = () => (
  <>
    <QiblaToolbarButton />
    <PrayerTimesScreen />
  </>
);

export default PrayerRoute;
