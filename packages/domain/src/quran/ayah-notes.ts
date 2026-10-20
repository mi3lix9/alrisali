import { ayahNumber, findAyah } from "./mushaf";
import type { AyahKey } from "./mushaf";

/** The longest an Ayah Note can be, in characters. */
export const AYAH_NOTE_MAX = 5000;

/**
 * What the Believer wrote about one ayah. An ayah has at most one note:
 * writing again replaces it.
 */
export interface AyahNote {
  ayah: AyahKey;
  text: string;
  /** ISO instant the note was last written. */
  updatedAt: string;
}

/** A note as stored: capped, and blank once only whitespace is left. */
export const cleanNoteText = (text: string): string =>
  text.trim() === "" ? "" : text.slice(0, AYAH_NOTE_MAX).trimEnd();

/**
 * The notes after writing `text` on the ayah: it replaces the ayah's note,
 * and a blank text removes it.
 */
export const writeNote = (
  notes: readonly AyahNote[],
  ayah: AyahKey,
  text: string,
  now: Date
): AyahNote[] => {
  const found = findAyah(ayah);
  if (!found) {
    throw new Error(`No ayah ${ayah} in the mushaf`);
  }
  const rest = notes.filter((note) => note.ayah !== found.key);
  const clean = cleanNoteText(text);
  return clean === ""
    ? rest
    : [...rest, { ayah: found.key, text: clean, updatedAt: now.toISOString() }];
};

/** The notes in mushaf order, those on ayat this mushaf lacks left out. */
export const sortNotes = (notes: readonly AyahNote[]): AyahNote[] =>
  notes
    .filter((note) => ayahNumber(note.ayah) !== undefined)
    .toSorted((a, b) => (ayahNumber(a.ayah) ?? 0) - (ayahNumber(b.ayah) ?? 0));

/** The ayat that carry a note, for the rosette's badge. */
export const notedAyat = (notes: readonly AyahNote[]): Set<AyahKey> =>
  new Set(notes.map((note) => note.ayah));

/** A text cursor: where the selection starts and ends. */
export interface TextSelection {
  start: number;
  end: number;
}

/**
 * Puts `insertion` where the cursor is, in place of any selected text,
 * on a line of its own when it lands in the middle of a line. Returns the
 * new text and the cursor after the insertion.
 */
export const insertAtCursor = (
  text: string,
  selection: TextSelection,
  insertion: string
): { text: string; selection: TextSelection } => {
  const start = Math.max(0, Math.min(selection.start, text.length));
  const end = Math.max(start, Math.min(selection.end, text.length));
  const before = text.slice(0, start);
  const after = text.slice(end);
  const lead = before === "" || before.endsWith("\n") ? "" : "\n";
  const trail = after === "" || after.startsWith("\n") ? "" : "\n";
  const inserted = `${lead}${insertion}${trail}`;
  const cursor = before.length + lead.length + insertion.length + trail.length;
  return {
    text: `${before}${inserted}${after}`,
    selection: { start: cursor, end: cursor },
  };
};
