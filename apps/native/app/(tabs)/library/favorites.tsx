import { FavoritesScreen } from "@/features/favorites";
import { useLibraryAssetTitle } from "@/features/library-assets";

const FavoritesRoute = () => (
  <FavoritesScreen libraryAssetTitle={useLibraryAssetTitle()} />
);

export default FavoritesRoute;
