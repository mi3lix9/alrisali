import { DeleteAccountCard } from "@/features/account";
import { QuranReaderSettingsCard } from "@/features/quran";
import { SettingsScreen } from "@/features/settings";

const SettingsRoute = () => (
  <SettingsScreen
    featureCards={
      <>
        <QuranReaderSettingsCard />
        <DeleteAccountCard />
      </>
    }
  />
);

export default SettingsRoute;
