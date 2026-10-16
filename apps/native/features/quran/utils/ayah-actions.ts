import type { AyahKey, RecitationEvent } from "@alrisali/domain/quran";
import { writeDigits } from "@alrisali/domain/shared";
import type { Digits } from "@alrisali/domain/shared";

/**
 * The ayah sheet's Play: recitation starts at the long-pressed ayah and goes
 * on through the Quran, replacing whatever was playing.
 */
export const playFromAyah = (
  ayah: AyahKey,
  reciter: string
): RecitationEvent => ({ type: "play", ayah, reciter });

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
