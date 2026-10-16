import { getQuranPage } from "@alrisali/content/quran";
import { z } from "zod";

/** The shapes a Believer can post: 1:1, 4:5 and 9:16. Pixels of the saved image. */
export const SHARE_IMAGE_SIZES = [
  { id: "square", width: 1080, height: 1080 },
  { id: "portrait", width: 1080, height: 1350 },
  { id: "story", width: 1080, height: 1920 },
] as const;

export type ShareImageSize = (typeof SHARE_IMAGE_SIZES)[number];
export type ShareImageSizeId = ShareImageSize["id"];

/** Flat colours: no gradients, no photos. `ink` is the colour of the text. */
export const SHARE_IMAGE_BACKGROUNDS = [
  { id: "white", background: "#ffffff", ink: "#111111" },
  { id: "sand", background: "#f4ecd8", ink: "#2b2418" },
  { id: "black", background: "#111111", ink: "#f2efe6" },
  { id: "green", background: "#1f4d3a", ink: "#f4f1e8" },
  { id: "navy", background: "#1d2b44", ink: "#f1f1f1" },
  { id: "maroon", background: "#5a1f24", ink: "#f6efe6" },
] as const;

export type ShareImageBackground = (typeof SHARE_IMAGE_BACKGROUNDS)[number];
export type ShareImageBackgroundId = ShareImageBackground["id"];

/** What an ayah image opens with: nothing, the Bismillah or the A'udhu. */
export const SHARE_IMAGE_OPENERS = ["none", "bismillah", "audhu"] as const;
export type ShareImageOpener = (typeof SHARE_IMAGE_OPENERS)[number];

/** The Bismillah as the mushaf prints it (KFGQPC), taken from its own data. */
export const BISMILLAH: string = (() => {
  const line = getQuranPage(2).lines.find((item) => item.kind === "basmala");
  if (line?.kind !== "basmala") {
    throw new Error("The Quran dataset has no Bismillah line");
  }
  return line.text;
})();

/** The A'udhu, set with the Quran font's marks. */
export const AUDHU = "أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيۡطَٰنِ ٱلرَّجِيمِ";

export const openerText = (opener: ShareImageOpener): string | null => {
  if (opener === "bismillah") {
    return BISMILLAH;
  }
  return opener === "audhu" ? AUDHU : null;
};

/** What the Believer chooses in the composer. */
export interface ShareImageOptions {
  size: ShareImageSizeId;
  background: ShareImageBackgroundId;
  opener: ShareImageOpener;
  /** The small app line under the content; the Believer can turn it off. */
  attribution: boolean;
}

export const DEFAULT_SHARE_IMAGE_OPTIONS: ShareImageOptions = {
  size: "square",
  background: "white",
  opener: "none",
  attribution: true,
};

export const shareImageSize = (id: ShareImageSizeId): ShareImageSize =>
  SHARE_IMAGE_SIZES.find((size) => size.id === id) ?? SHARE_IMAGE_SIZES[0];

export const shareImageBackground = (
  id: ShareImageBackgroundId
): ShareImageBackground =>
  SHARE_IMAGE_BACKGROUNDS.find((item) => item.id === id) ??
  SHARE_IMAGE_BACKGROUNDS[0];

/** Today's Prayer Times as the composer draws them, already worded and timed. */
export const shareTimesSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string(),
  rows: z
    .array(z.object({ label: z.string().min(1), time: z.string().min(1) }))
    .min(1)
    .max(12),
  /** E.g. the calculation method; shown under the rows. */
  footer: z.string().nullable(),
});
export type ShareTimes = z.infer<typeof shareTimesSchema>;

/** A Supplication's section, shared as an excerpt. */
export interface ShareSupplicationExcerpt {
  text: string;
  /** E.g. the Supplication's title. */
  source: string;
}

/** An ayah, shared with its reference. */
export interface ShareAyahExcerpt {
  text: string;
  /** E.g. "سورة البقرة · ٢٥٥". */
  reference: string;
}

const CANVAS_PADDING = 96;
const ATTRIBUTION_HEIGHT = 80;
const OPENER_HEIGHT = 150;
const REFERENCE_HEIGHT = 110;

export interface ShareTextBox {
  width: number;
  height: number;
}

/**
 * The room the main text has on the canvas once the padding, the opener, the
 * reference line and the attribution have taken theirs.
 */
export const shareTextBox = (
  size: ShareImageSize,
  { opener, attribution }: Pick<ShareImageOptions, "opener" | "attribution">
): ShareTextBox => ({
  width: size.width - CANVAS_PADDING * 2,
  height:
    size.height -
    CANVAS_PADDING * 2 -
    REFERENCE_HEIGHT -
    (opener === "none" ? 0 : OPENER_HEIGHT) -
    (attribution ? ATTRIBUTION_HEIGHT : 0),
});

/** Line height as a multiple of the font size, tall enough for the marks. */
export const SHARE_TEXT_LINE_HEIGHT = 1.9;
/** Widest an average Arabic glyph with its marks runs, in em. */
const GLYPH_WIDTH_EM = 0.5;
const WRAP_SLACK = 1.1;
export const SHARE_TEXT_MAX_FONT = 72;
export const SHARE_TEXT_MIN_FONT = 30;
const FONT_STEP = 2;

const linesNeeded = (length: number, fontSize: number, width: number) =>
  Math.max(
    1,
    Math.ceil((length * GLYPH_WIDTH_EM * fontSize * WRAP_SLACK) / width)
  );

/**
 * The largest font size, down to the smallest readable one, at which `text`
 * fits the box. `fits` is false when even the smallest does not: the composer
 * then asks for a taller image rather than cutting the text.
 */
export const fitShareText = (
  text: string,
  box: ShareTextBox
): { fontSize: number; fits: boolean } => {
  for (
    let fontSize = SHARE_TEXT_MAX_FONT;
    fontSize >= SHARE_TEXT_MIN_FONT;
    fontSize -= FONT_STEP
  ) {
    const height =
      linesNeeded(text.length, fontSize, box.width) *
      fontSize *
      SHARE_TEXT_LINE_HEIGHT;
    if (height <= box.height) {
      return { fontSize, fits: true };
    }
  }
  return { fontSize: SHARE_TEXT_MIN_FONT, fits: false };
};

/** The file name of a saved image, e.g. "alrisali-ayah-2-255-square.png". */
export const shareImageFileName = (
  subject: string,
  size: ShareImageSizeId
): string =>
  `alrisali-${subject.replaceAll(/[^\p{L}\p{N}]+/gu, "-").replaceAll(/^-|-$/gu, "")}-${size}.png`;

const TIMES_HEADER_HEIGHT = 260;
const TIMES_FOOTER_HEIGHT = 70;
const MAX_TIMES_ROW_HEIGHT = 120;

/**
 * How tall each Prayer Time row is, so every row of the day fits under the
 * title and above the footer and the attribution.
 */
export const shareTimesRowHeight = (
  size: ShareImageSize,
  rowCount: number,
  { attribution }: Pick<ShareImageOptions, "attribution">
): number =>
  Math.min(
    MAX_TIMES_ROW_HEIGHT,
    Math.floor(
      (size.height -
        CANVAS_PADDING * 2 -
        TIMES_HEADER_HEIGHT -
        TIMES_FOOTER_HEIGHT -
        (attribution ? ATTRIBUTION_HEIGHT : 0)) /
        Math.max(1, rowCount)
    )
  );
