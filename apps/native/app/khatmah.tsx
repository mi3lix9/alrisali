import { KhatmahScreen } from "@/features/khatmah";
import { ShareLinkButton } from "@/features/links";
import { RecitationDuasLink } from "@/features/quran";

const KhatmahRoute = () => (
  <KhatmahScreen
    completionActions={<RecitationDuasLink moment="completion" />}
    shareAction={(id) => (
      <ShareLinkButton
        testID="khatmah-share-link"
        link={{ kind: "khatmah", id }}
      />
    )}
  />
);

export default KhatmahRoute;
