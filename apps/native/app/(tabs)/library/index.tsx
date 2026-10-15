import { BooksCard } from "@/features/books";
import { FavoritesCard } from "@/features/favorites";
import {
  LibraryAssetsCard,
  useLibraryAssetTitle,
} from "@/features/library-assets";
import { ContinueReadingCard, QuranLibraryCard } from "@/features/quran";
import { Screen } from "@/shared/ui/screen";

const LibraryRoute = () => {
  const libraryAssetTitle = useLibraryAssetTitle();
  return (
    <Screen>
      <ContinueReadingCard />
      <QuranLibraryCard />
      <FavoritesCard libraryAssetTitle={libraryAssetTitle} />
      <BooksCard />
      <LibraryAssetsCard />
    </Screen>
  );
};

export default LibraryRoute;
