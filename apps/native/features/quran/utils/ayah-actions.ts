import type { AyahKey, PlayTo, RecitationEvent } from "@alrisali/domain/quran";
import { writeDigits } from "@alrisali/domain/shared";
import type { Digits } from "@alrisali/domain/shared";

/**
 * The ayah sheet's Play: recitation starts at the long-pressed ayah and goes
 * on through the Quran, replacing whatever was playing. Play To gives the end
 * it stops at.
 */
export const playFromAyah = (
  ayah: AyahKey,
  reciter: string,
  to?: PlayTo
): RecitationEvent => ({ type: "play", ayah, reciter, ...(to ? { to } : {}) });

interface AyahCopy {
  text: string;
  key: AyahKey;
  surahName: string;
  /** The interface's digits (useDigits). */
  digits: Digits;
}

/** The ayah sheet's Copy: the text, then "(surah s:a)" in the UI's digits. */
export const ayahCopyText = ({
  text,
  key,
  surahName,
  digits,
}: AyahCopy): string => `${text}\n(${surahName} ${writeDigits(key, digits)})`;
