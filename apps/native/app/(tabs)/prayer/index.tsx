import { KhushuButton } from "@/features/khushu";
import { PrayerAssistantCard } from "@/features/prayer-assistant";
import { PrayerLogCard } from "@/features/prayer-log";
import { PrayerTimesScreen } from "@/features/prayer-times";
import { QiblaToolbarButton } from "@/features/qibla";
import { PrayerReminderBell } from "@/features/reminders";

const PrayerRoute = () => (
  <>
    <QiblaToolbarButton />
    <PrayerTimesScreen
      renderReminder={(name, time) => (
        <PrayerReminderBell name={name} time={time} />
      )}
    >
      <PrayerLogCard
        loggedSalahActions={(date, salah) => (
          <KhushuButton date={date} salah={salah} />
        )}
      />
      <PrayerAssistantCard />
    </PrayerTimesScreen>
  </>
);

export default PrayerRoute;
