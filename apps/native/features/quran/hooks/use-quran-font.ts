import quranFontAsset from "@alrisali/content/quran/font.ttf";
import { useFonts } from "expo-font";

/** The KFGQPC HAFS Uthmanic Script font, bundled unmodified (ADR-0004). */
export const QURAN_FONT = "KFGQPCHafs";

/** Whether the Quran font is ready to draw with. */
export const useQuranFont = (): boolean => {
  const [loaded] = useFonts({ [QURAN_FONT]: quranFontAsset });
  return loaded;
};
