import { TaqibatButton } from "@/features/books";
import { PrayerAssistantScreen } from "@/features/prayer-assistant";

const PrayerAssistantRoute = () => (
  <PrayerAssistantScreen
    completionActions={(salah) => <TaqibatButton salah={salah} />}
  />
);

export default PrayerAssistantRoute;
