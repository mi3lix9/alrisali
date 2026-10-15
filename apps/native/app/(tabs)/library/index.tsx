import { BooksCard } from "@/features/books";
import { FavoritesCard } from "@/features/favorites";
import { ContinueReadingCard, QuranLibraryCard } from "@/features/quran";
import { Screen } from "@/shared/ui/screen";

const LibraryRoute = () => (
  <Screen>
    <ContinueReadingCard />
    <QuranLibraryCard />
    <FavoritesCard />
    <BooksCard />
  </Screen>
);

export default LibraryRoute;
