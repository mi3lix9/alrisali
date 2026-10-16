import { SupplicationReaderScreen } from "@/features/books";
import { FavoriteButton } from "@/features/favorites";
import { ReadTodayButton } from "@/features/reading-completion";
import { ReciteAlong } from "@/features/recite-along";

const SupplicationRoute = () => (
  <SupplicationReaderScreen
    reciteAlong={ReciteAlong}
    toolbarActions={(id) => (
      <>
        <ReadTodayButton supplicationId={id} />
        <FavoriteButton item={{ kind: "supplication", key: id }} />
      </>
    )}
  />
);

export default SupplicationRoute;
