import { BooksCard } from "@/features/books";
import { FavoritesCard } from "@/features/favorites";
import { LessonsLinkCard } from "@/features/lessons";
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
      <LessonsLinkCard />
      <LibraryAssetsCard />
    </Screen>
  );
};

export default LibraryRoute;
