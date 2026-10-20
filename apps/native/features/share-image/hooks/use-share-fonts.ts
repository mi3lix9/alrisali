import quranFontAsset from "@alrisali/content/quran/font.ttf";
import { useFonts } from "expo-font";

/** The Quran font (ADR-0004); the same face the reader loads, by the same name. */
export const SHARE_QURAN_FONT = "KFGQPCHafs";

/** Whether the Quran font is ready to draw the image with. */
export const useShareFonts = (): boolean => {
  const [loaded] = useFonts({ [SHARE_QURAN_FONT]: quranFontAsset });
  return loaded;
};
