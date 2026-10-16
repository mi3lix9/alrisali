import "../i18n";
import { BOOKS, getBook, loadSupplicationText } from "@alrisali/content/books";
import type { Passage } from "@alrisali/content/books";
import {
  indexSupplications,
  searchSupplications,
} from "@alrisali/domain/books";
import type { SupplicationSearchIndex } from "@alrisali/domain/books";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";
import type { SearchSection } from "@/shared/ui/search-panel";

/** Titles only: searchable at once, before any text is loaded. */
const TITLE_INDEX = indexSupplications(BOOKS);

/**
 * Every Supplication's text, indexed one section at a time so typing stays
 * responsive while ~5 MB of text is read.
 */
const indexAllTexts = async (): Promise<SupplicationSearchIndex> => {
  const parts: SupplicationSearchIndex[] = [];
  for (const book of BOOKS) {
    for (const section of book.sections) {
      const texts = new Map<string, readonly Passage[]>(
        // oxlint-disable-next-line no-await-in-loop -- one section at a time, so the UI draws between them
        await Promise.all(
          section.supplications.map(
            async ({ id }) => [id, await loadSupplicationText(id)] as const
          )
        )
      );
      parts.push(indexSupplications([{ ...book, sections: [section] }], texts));
      // Let the UI draw between sections.
      // oxlint-disable-next-line no-await-in-loop, promise/avoid-new -- a timer is the only way to yield to the UI
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }
  }
  return parts.flat();
};

/**
 * The Supplications whose title or text matches `query`, each opening its
 * reader. Titles answer at once; texts join once indexed, once per session.
 */
export const useSupplicationSearch = (query: string): SearchSection => {
  const { t } = useTranslation("books");
  const texts = useQuery({
    queryKey: ["books", "search-index"],
    queryFn: indexAllTexts,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  const result = useMemo(
    () => searchSupplications(texts.data ?? TITLE_INDEX, query),
    [texts.data, query]
  );

  let note: string | undefined;
  if (texts.isPending) {
    note = t("search.indexing");
  } else if (result.total > result.matches.length) {
    note = t("search.more", {
      shown: formatNumber(result.matches.length),
      total: formatNumber(result.total),
    });
  }

  return {
    id: "supplications",
    title: t("search.title"),
    results: result.matches.map(({ supplication, passage }) => ({
      key: supplication.id,
      title: supplication.title[launchLanguage],
      description:
        passage ?? getBook(supplication.bookId)?.title[launchLanguage],
      testID: `search-supplication-${supplication.id}`,
      open: () =>
        router.push({
          pathname: "/library/supplication/[id]",
          params: { id: supplication.id },
        }),
    })),
    note,
  };
};
