import {
  DeleteAccountCard,
  ExportDataCard,
  GuestNudge,
} from "@/features/account";
import { BirthYearCard } from "@/features/analytics";
import { AnnouncementsCard } from "@/features/announcements";
import { QuranReaderSettingsCard } from "@/features/quran";
import { SettingsScreen } from "@/features/settings";
import { TasbihSettingsCard } from "@/features/tasbih";

const SettingsRoute = () => (
  <SettingsScreen
    featureCards={
      <>
        <AnnouncementsCard />
        <QuranReaderSettingsCard />
        <BirthYearCard />
        <TasbihSettingsCard />
        <GuestNudge showSignIn />
        <ExportDataCard />
        <DeleteAccountCard />
      </>
    }
  />
);

export default SettingsRoute;
