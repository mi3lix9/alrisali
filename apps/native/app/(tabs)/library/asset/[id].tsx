import { FavoriteButton } from "@/features/favorites";
import { LibraryAssetScreen } from "@/features/library-assets";

const LibraryAssetRoute = () => (
  <LibraryAssetScreen
    headerRight={(id) => (
      <FavoriteButton item={{ kind: "library-asset", key: id }} />
    )}
  />
);

export default LibraryAssetRoute;
