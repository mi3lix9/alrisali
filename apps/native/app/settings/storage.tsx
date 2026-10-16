import { RecitationDownloads } from "@/features/quran";
import { AdhanDownloads } from "@/features/reminders";
import { StorageScreen } from "@/features/storage";

const StorageRoute = () => (
  <StorageScreen>
    <RecitationDownloads />
    <AdhanDownloads />
  </StorageScreen>
);

export default StorageRoute;
