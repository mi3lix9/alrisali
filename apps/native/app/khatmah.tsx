import { KhatmahScreen } from "@/features/khatmah";
import { RecitationDuasLink } from "@/features/quran";

const KhatmahRoute = () => (
  <KhatmahScreen
    completionActions={<RecitationDuasLink moment="completion" />}
  />
);

export default KhatmahRoute;
