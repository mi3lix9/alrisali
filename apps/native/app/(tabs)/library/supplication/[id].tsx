import { SupplicationReaderScreen } from "@/features/books";
import { FavoriteButton } from "@/features/favorites";
import { ReadTodayButton } from "@/features/reading-completion";

const SupplicationRoute = () => (
  <SupplicationReaderScreen
    headerRight={(id) => (
      <FavoriteButton item={{ kind: "supplication", key: id }} />
    )}
    footer={(id) => <ReadTodayButton supplicationId={id} />}
  />
);

export default SupplicationRoute;
