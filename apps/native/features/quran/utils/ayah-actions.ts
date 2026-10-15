import type { AyahKey, RecitationEvent } from "@alrisali/domain/quran";

import { formatNumber } from "./format";

/**
 * The ayah sheet's Play: recitation starts at the long-pressed ayah and goes
 * on through the Quran, replacing whatever was playing.
 */
export const playFromAyah = (
  ayah: AyahKey,
  reciterId: number
): RecitationEvent => ({ type: "play", ayah, reciterId });

interface AyahCopy {
  text: string;
  key: AyahKey;
  surahName: string;
  language: string;
}

/** The ayah sheet's Copy: the text, then "(surah s:a)" in the UI's digits. */
export const ayahCopyText = ({
  text,
  key,
  surahName,
  language,
}: AyahCopy): string => {
  const [surah, ayah] = key.split(":").map(Number);
  const reference = `${formatNumber(language, surah ?? 0)}:${formatNumber(language, ayah ?? 0)}`;
  return `${text}\n(${surahName} ${reference})`;
};
