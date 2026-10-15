import { BooksCard } from "@/features/books";
import { FavoritesCard } from "@/features/favorites";
import { QuranLibraryCard } from "@/features/quran";
import { Screen } from "@/shared/ui/screen";

const LibraryRoute = () => (
  <Screen>
    <QuranLibraryCard />
    <FavoritesCard />
    <BooksCard />
  </Screen>
);

export default LibraryRoute;
