import { z } from "zod";

/**
 * How the Supplication reader sets its text: the Arabic face, the size, the
 * space between lines and the reading theme. One format serves every Book.
 */

/** Amiri (Naskh) and IBM Plex Sans Arabic are bundled; `system` is the device's. */
export const READER_FONTS = ["amiri", "system", "plex"] as const;

export type ReaderFont = (typeof READER_FONTS)[number];

export const READER_SPACINGS = ["compact", "normal", "wide"] as const;

export type ReaderSpacing = (typeof READER_SPACINGS)[number];

/** `system` follows the app's light or dark theme. */
export const READER_THEMES = ["light", "dark", "system", "sepia"] as const;

export type ReaderTheme = (typeof READER_THEMES)[number];

export const READER_FONT_SIZE = { min: 16, max: 40, step: 2 } as const;

export interface ReaderFormat {
  font: ReaderFont;
  fontSize: number;
  spacing: ReaderSpacing;
  theme: ReaderTheme;
}

export const DEFAULT_READER_FORMAT: ReaderFormat = {
  font: "amiri",
  fontSize: 24,
  spacing: "normal",
  theme: "system",
};

const LINE_HEIGHT: Record<ReaderSpacing, number> = {
  compact: 1.8,
  normal: 2.15,
  wide: 2.5,
};

const fieldSchemas = {
  font: z.enum(READER_FONTS),
  fontSize: z
    .number()
    .int()
    .min(READER_FONT_SIZE.min)
    .max(READER_FONT_SIZE.max),
  spacing: z.enum(READER_SPACINGS),
  theme: z.enum(READER_THEMES),
};

const field = <Key extends keyof ReaderFormat>(
  stored: Record<string, unknown>,
  key: Key
): ReaderFormat[Key] => {
  const parsed = fieldSchemas[key].safeParse(stored[key]);
  return parsed.success
    ? (parsed.data as ReaderFormat[Key])
    : DEFAULT_READER_FORMAT[key];
};

/**
 * The format saved on the device, read field by field: a missing or unknown
 * choice (an older or newer app's) falls back to its default alone.
 */
export const readReaderFormat = (stored: unknown): ReaderFormat => {
  const record =
    typeof stored === "object" && stored !== null
      ? (stored as Record<string, unknown>)
      : {};
  return {
    font: field(record, "font"),
    fontSize: field(record, "fontSize"),
    spacing: field(record, "spacing"),
    theme: field(record, "theme"),
  };
};

/** The size one step up (+1) or down (-1), within the reader's bounds. */
export const stepReaderFontSize = (fontSize: number, direction: 1 | -1) =>
  Math.min(
    READER_FONT_SIZE.max,
    Math.max(READER_FONT_SIZE.min, fontSize + direction * READER_FONT_SIZE.step)
  );

/** The line height, in points, for text of this size at this spacing. */
export const readerLineHeight = (spacing: ReaderSpacing, fontSize: number) =>
  Math.round(fontSize * LINE_HEIGHT[spacing]);
