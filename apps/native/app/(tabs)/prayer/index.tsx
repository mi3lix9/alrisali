import { KhushuButton } from "@/features/khushu";
import { PrayerLogCard } from "@/features/prayer-log";
import { PrayerTimesScreen } from "@/features/prayer-times";
import { QiblaToolbarButton } from "@/features/qibla";

const PrayerRoute = () => (
  <>
    <QiblaToolbarButton />
    <PrayerTimesScreen>
      <PrayerLogCard
        loggedSalahActions={(date, salah) => (
          <KhushuButton date={date} salah={salah} />
        )}
      />
    </PrayerTimesScreen>
  </>
);

export default PrayerRoute;
