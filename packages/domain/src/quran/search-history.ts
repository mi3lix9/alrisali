/** How many searches the Quran search remembers. */
export const SEARCH_HISTORY_LIMIT = 10;

/** A query as the history keeps it: trimmed, inner spaces collapsed. */
const cleanQuery = (query: string): string =>
  query.trim().replaceAll(/\s+/gu, " ");

const sameQuery = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase();

/**
 * The history after a search: the query first (a repeat moves up instead of
 * appearing twice), the last ten kept. A blank query changes nothing.
 */
export const recordSearch = (history: string[], query: string): string[] => {
  const cleaned = cleanQuery(query);
  if (cleaned === "") {
    return history;
  }
  return [
    cleaned,
    ...history.filter((entry) => !sameQuery(entry, cleaned)),
  ].slice(0, SEARCH_HISTORY_LIMIT);
};
