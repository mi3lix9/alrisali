/**
 * The section (a passage index, from 0) the reader offers to continue at, given
 * the section saved for the Supplication and how many sections its text has
 * now; null when it opens at the top with nothing to offer.
 */
export const resumeSection = (
  saved: number | null,
  sectionCount: number
): number | null => {
  if (saved === null || sectionCount === 0) {
    return null;
  }
  const section = Math.min(Math.floor(saved), sectionCount - 1);
  return section > 0 ? section : null;
};
