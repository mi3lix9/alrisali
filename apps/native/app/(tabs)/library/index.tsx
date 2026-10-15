import { BooksCard } from "@/features/books";
import { QuranLibraryCard } from "@/features/quran";
import { Screen } from "@/shared/ui/screen";

const LibraryRoute = () => (
  <Screen>
    <QuranLibraryCard />
    <BooksCard />
  </Screen>
);

export default LibraryRoute;
