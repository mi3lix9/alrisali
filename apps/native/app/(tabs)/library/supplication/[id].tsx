import { SupplicationReaderScreen } from "@/features/books";
import { FavoriteButton } from "@/features/favorites";
import { ShareLinkIconButton } from "@/features/links";
import { ReadTodayButton } from "@/features/reading-completion";
import { ReciteAlong } from "@/features/recite-along";
import { ShareSupplicationImageButton } from "@/features/share-image";

const SupplicationRoute = () => (
  <SupplicationReaderScreen
    reciteAlong={ReciteAlong}
    toolbarActions={(id) => (
      <>
        <ReadTodayButton supplicationId={id} />
        <FavoriteButton item={{ kind: "supplication", key: id }} />
        <ShareLinkIconButton
          testID="supplication-share-link"
          link={{ kind: "supplication", id }}
        />
        <ShareSupplicationImageButton supplicationId={id} />
      </>
    )}
  />
);

export default SupplicationRoute;
