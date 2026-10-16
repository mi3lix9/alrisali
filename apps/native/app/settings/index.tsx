import {
  DeleteAccountCard,
  ExportDataCard,
  GuestNudge,
} from "@/features/account";
import { BirthYearCard } from "@/features/analytics";
import { AnnouncementsCard } from "@/features/announcements";
import { QuranReaderSettingsCard } from "@/features/quran";
import { SettingsScreen } from "@/features/settings";

const SettingsRoute = () => (
  <SettingsScreen
    featureCards={
      <>
        <AnnouncementsCard />
        <QuranReaderSettingsCard />
        <BirthYearCard />
        <GuestNudge showSignIn />
        <ExportDataCard />
        <DeleteAccountCard />
      </>
    }
  />
);

export default SettingsRoute;
