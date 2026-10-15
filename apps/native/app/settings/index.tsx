import { QuranReaderSettingsCard } from "@/features/quran";
import { SettingsScreen } from "@/features/settings";

const SettingsRoute = () => (
  <SettingsScreen featureCards={<QuranReaderSettingsCard />} />
);

export default SettingsRoute;
