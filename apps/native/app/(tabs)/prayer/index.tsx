import { TaqibatButton } from "@/features/books";
import { KhushuButton } from "@/features/khushu";
import { PrayerAssistantCard } from "@/features/prayer-assistant";
import { PrayerLogCard } from "@/features/prayer-log";
import { PrayerTimesScreen } from "@/features/prayer-times";
import { QadaCard, QadaSalahToggle } from "@/features/qada";
import { QiblaToolbarButton } from "@/features/qibla";
import { AtTimeAlertButton } from "@/features/reminders";
import { ShareTimesImageButton } from "@/features/share-image";
import { MonthlyTimetableLink } from "@/features/timetable";

const PrayerRoute = () => (
  <>
    <QiblaToolbarButton />
    <PrayerTimesScreen
      timetableRowActions={(name) => <AtTimeAlertButton prayerTime={name} />}
      timetableShare={(times) => <ShareTimesImageButton times={times} />}
    >
      <MonthlyTimetableLink />
      <PrayerAssistantCard />
      <PrayerLogCard
        loggedSalahActions={(date, salah) => (
          <>
            <KhushuButton date={date} salah={salah} />
            <TaqibatButton salah={salah} />
          </>
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
