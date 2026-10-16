import { describe, expect, it } from "vitest";

import { PAGE_PALETTES, pagePaletteColors } from "./page-palette";
import {
  DEFAULT_QURAN_READER_SETTINGS,
  quranReaderSettingsSchema,
} from "./reader";

describe("page palettes", () => {
  it("offers theme, white, cream, soft dark and black", () => {
    expect(PAGE_PALETTES).toStrictEqual([
      "theme",
      "white",
      "cream",
      "soft-dark",
      "black",
    ]);
  });

  it("defines colours for every palette, each with text apart from its background", () => {
    for (const palette of PAGE_PALETTES) {
      const colors = pagePaletteColors(palette, "light");
      expect(colors.text).not.toBe(colors.background);
    }
  });

  it("is a reader setting that defaults to the app theme and keeps the screen awake", () => {
    expect(DEFAULT_QURAN_READER_SETTINGS.pagePalette).toBe("theme");
    expect(DEFAULT_QURAN_READER_SETTINGS.keepAwake).toBeTruthy();
    expect(
      quranReaderSettingsSchema.shape.pagePalette.safeParse("sepia").success
    ).toBeFalsy();
  });

  it("follows the app theme: white in light mode, pure black in dark mode", () => {
    expect(pagePaletteColors("theme", "light").background).toBe("#ffffff");
    expect(pagePaletteColors("theme", "dark").background).toBe("#000000");
    expect(pagePaletteColors("cream", "dark").background).not.toBe("#000000");
  });
});
