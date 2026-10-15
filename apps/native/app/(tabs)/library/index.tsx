import { useTranslation } from "react-i18next";

import { BooksCard, useSupplicationSearch } from "@/features/books";
import { FavoritesCard } from "@/features/favorites";
import { LessonsLinkCard } from "@/features/lessons";
import {
  LibraryAssetsCard,
  useLibraryAssetSearch,
  useLibraryAssetTitle,
} from "@/features/library-assets";
import {
  ContinueReadingCard,
  QuranLibraryCard,
  useSurahSearch,
} from "@/features/quran";
import { Screen } from "@/shared/ui/screen";
import { SearchPanel, SearchResults } from "@/shared/ui/search-panel";

const LibrarySearchResults = ({ query }: { query: string }) => (
  <SearchResults
    sections={[
      useSurahSearch(query),
      useSupplicationSearch(query),
      useLibraryAssetSearch(query),
    ]}
  />
);

const LibraryRoute = () => {
  const { t } = useTranslation();
  const libraryAssetTitle = useLibraryAssetTitle();
  return (
    <Screen>
      <SearchPanel
        placeholder={t("library.searchPlaceholder")}
        results={(query) => <LibrarySearchResults query={query} />}
      >
        <ContinueReadingCard />
        <QuranLibraryCard />
        <FavoritesCard libraryAssetTitle={libraryAssetTitle} />
        <BooksCard />
        <LessonsLinkCard />
        <LibraryAssetsCard />
      </SearchPanel>
    </Screen>
  );
};

export default LibraryRoute;
