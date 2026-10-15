import { DeleteAccountCard } from "@/features/account";
import { AnnouncementsCard } from "@/features/announcements";
import { QuranReaderSettingsCard } from "@/features/quran";
import { SettingsScreen } from "@/features/settings";

const SettingsRoute = () => (
  <SettingsScreen
    featureCards={
      <>
        <AnnouncementsCard />
        <QuranReaderSettingsCard />
        <DeleteAccountCard />
      </>
    }
  />
);

export default SettingsRoute;
