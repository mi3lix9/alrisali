import amiriAsset from "@alrisali/content/books/fonts/amiri.ttf";
import plexAsset from "@alrisali/content/books/fonts/ibm-plex-sans-arabic.ttf";
import type { ReaderFont } from "@alrisali/domain/books";
import { useFonts } from "expo-font";

// The bundled faces (OFL, credited in Sources & Credits); `system` draws with
// the device's own Arabic face.
const FONT_FAMILIES = {
  amiri: "Amiri",
  plex: "IBMPlexSansArabic",
} as const;

/**
 * The font family to set a reader face with, or undefined for the device's
 * face; a bundled face falls back to the device's until it has loaded.
 */
export const useReaderFontFamily = (): ((
  font: ReaderFont
) => string | undefined) => {
  const [loaded] = useFonts({
    [FONT_FAMILIES.amiri]: amiriAsset,
    [FONT_FAMILIES.plex]: plexAsset,
  });
  return (font) =>
    loaded && font !== "system" ? FONT_FAMILIES[font] : undefined;
};
