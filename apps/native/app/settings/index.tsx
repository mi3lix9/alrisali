import { DeleteAccountCard } from "@/features/account";
import { BirthYearCard } from "@/features/analytics";
import { QuranReaderSettingsCard } from "@/features/quran";
import { SettingsScreen } from "@/features/settings";

const SettingsRoute = () => (
  <SettingsScreen
    featureCards={
      <>
        <QuranReaderSettingsCard />
        <BirthYearCard />
        <DeleteAccountCard />
      </>
    }
  />
);

export default SettingsRoute;
