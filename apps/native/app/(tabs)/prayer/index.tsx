import { KhushuButton } from "@/features/khushu";
import { PrayerAssistantCard } from "@/features/prayer-assistant";
import { PrayerLogCard } from "@/features/prayer-log";
import { PrayerTimesScreen } from "@/features/prayer-times";
import { QiblaToolbarButton } from "@/features/qibla";
import { AtTimeAlertButton } from "@/features/reminders";

const PrayerRoute = () => (
  <>
    <QiblaToolbarButton />
    <PrayerTimesScreen
      timetableRowActions={(name) => <AtTimeAlertButton prayerTime={name} />}
    >
      <PrayerAssistantCard />
      <PrayerLogCard
        loggedSalahActions={(date, salah) => (
          <KhushuButton date={date} salah={salah} />
        )}
      />
    </PrayerTimesScreen>
  </>
);

export default PrayerRoute;
