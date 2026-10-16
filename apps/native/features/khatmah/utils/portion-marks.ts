import type { AyahKey } from "@alrisali/content/quran";

/** What the reader draws on an ayah for the Khatmah: an edge of today's portion. */
export interface KhatmahDecoration {
  kind: "khatmah-portion";
  edge: "start" | "end";
}

/**
 * The marks for today's portion: its first ayah, where the Believer starts
 * (or resumes), and its last, where they stop. A one-ayah portion has both.
 */
export const portionMarks = (
  portion: { from: AyahKey; to: AyahKey } | null
): ReadonlyMap<AyahKey, readonly KhatmahDecoration[]> => {
  const marks = new Map<AyahKey, KhatmahDecoration[]>();
  if (!portion) {
    return marks;
  }
  marks.set(portion.from, [{ kind: "khatmah-portion", edge: "start" }]);
  marks.set(portion.to, [
    ...(marks.get(portion.to) ?? []),
    { kind: "khatmah-portion", edge: "end" },
  ]);
  return marks;
};
