import { describe, expect, it } from "vitest";

import {
  DEFAULT_READER_FORMAT,
  readerLineHeight,
  readReaderFormat,
  stepReaderFontSize,
} from "./reader-format";

describe(readReaderFormat, () => {
  it("opens a first reader in the default format", () => {
    expect(readReaderFormat(null)).toStrictEqual({
      font: "amiri",
      fontSize: 24,
      spacing: "normal",
      theme: "system",
    });
  });

  it("keeps the format the Believer chose", () => {
    const chosen = {
      font: "plex",
      fontSize: 30,
      spacing: "wide",
      theme: "sepia",
    };

    expect(readReaderFormat(chosen)).toStrictEqual(chosen);
  });

  it("keeps a size saved before the format sheet existed", () => {
    expect(readReaderFormat({ language: "ar", fontSize: 18 })).toStrictEqual({
      ...DEFAULT_READER_FORMAT,
      fontSize: 18,
    });
  });

  it("falls back field by field when a saved choice is unknown", () => {
    expect(
      readReaderFormat({
        font: "comic",
        fontSize: 400,
        spacing: "wide",
        theme: "neon",
      })
    ).toStrictEqual({ ...DEFAULT_READER_FORMAT, spacing: "wide" });
  });
});

describe(stepReaderFontSize, () => {
  it("grows and shrinks the text two points a step", () => {
    expect(stepReaderFontSize(24, 1)).toBe(26);
    expect(stepReaderFontSize(24, -1)).toBe(22);
  });

  it("stops at the smallest and largest sizes", () => {
    expect(stepReaderFontSize(16, -1)).toBe(16);
    expect(stepReaderFontSize(40, 1)).toBe(40);
  });
});

describe(readerLineHeight, () => {
  it("spaces lines further apart from compact to wide", () => {
    expect(readerLineHeight("compact", 20)).toBe(36);
    expect(readerLineHeight("normal", 20)).toBe(43);
    expect(readerLineHeight("wide", 20)).toBe(50);
  });
});
