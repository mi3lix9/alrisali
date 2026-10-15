import { z } from "zod";

/** Arabic text with an optional English version, as Admins write it. */
const textSchema = z.object({
  ar: z.string().trim().min(1),
  en: z.string().trim().default(""),
});

/**
 * The JSON file of a structured-text Library Asset: sections, each with an
 * optional title and its passages.
 *
 * ```json
 * { "sections": [{ "title": { "ar": "…", "en": "…" },
 *                  "passages": [{ "ar": "…", "en": "…" }] }] }
 * ```
 */
export const structuredTextSchema = z.object({
  sections: z
    .array(
      z.object({
        title: textSchema.nullable().default(null),
        passages: z.array(textSchema).min(1),
      })
    )
    .min(1),
});

export type StructuredText = z.infer<typeof structuredTextSchema>;

/** One line of a structured text as a reader shows it. */
export interface StructuredTextBlock {
  /** The block's place in the text: what a reading position counts. */
  index: number;
  type: "title" | "passage";
  text: { ar: string; en: string };
}

/** Every title and passage in reading order. */
export const structuredTextBlocks = (
  text: StructuredText
): StructuredTextBlock[] =>
  text.sections
    .flatMap(({ title, passages }) => [
      ...(title ? [{ type: "title" as const, text: title }] : []),
      ...passages.map((passage) => ({
        type: "passage" as const,
        text: passage,
      })),
    ])
    .map((block, index) => ({ index, ...block }));
