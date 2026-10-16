import { KhushuButton } from "@/features/khushu";
import { PrayerAssistantCard } from "@/features/prayer-assistant";
import { PrayerLogCard } from "@/features/prayer-log";
import { PrayerTimesScreen } from "@/features/prayer-times";
import { QadaCard, QadaSalahToggle } from "@/features/qada";
import { QiblaToolbarButton } from "@/features/qibla";

const PrayerRoute = () => (
  <>
    <QiblaToolbarButton />
    <PrayerTimesScreen>
      <PrayerAssistantCard />
      <PrayerLogCard
        loggedSalahActions={(date, salah) => (
          <KhushuButton date={date} salah={salah} />
        )}
        salahActions={(date, salah) => (
          <QadaSalahToggle date={date} salah={salah} />
        )}
      />
      <QadaCard />
    </PrayerTimesScreen>
  </>
);

export default PrayerRoute;
