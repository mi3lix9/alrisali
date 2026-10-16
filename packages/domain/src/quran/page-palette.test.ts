import { describe, expect, it } from "vitest";

import { PAGE_PALETTE_COLORS, PAGE_PALETTES } from "./page-palette";
import {
  DEFAULT_QURAN_READER_SETTINGS,
  quranReaderSettingsSchema,
} from "./reader";

describe("page palettes", () => {
  it("offers white, cream, soft dark and black", () => {
    expect(PAGE_PALETTES).toStrictEqual([
      "white",
      "cream",
      "soft-dark",
      "black",
    ]);
  });

  it("defines colours for every palette, each with text apart from its background", () => {
    for (const palette of PAGE_PALETTES) {
      const colors = PAGE_PALETTE_COLORS[palette];
      expect(colors.text).not.toBe(colors.background);
    }
  });

  it("is a reader setting that defaults to white and keeps the screen awake", () => {
    expect(DEFAULT_QURAN_READER_SETTINGS.pagePalette).toBe("white");
    expect(DEFAULT_QURAN_READER_SETTINGS.keepAwake).toBeTruthy();
    expect(
      quranReaderSettingsSchema.shape.pagePalette.safeParse("sepia").success
    ).toBeFalsy();
  });
});
