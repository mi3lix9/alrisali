/** A text in Arabic and English. */
export interface Localized {
  ar: string;
  en: string;
}

/** One paragraph of a Supplication: its Arabic, and its English where the source has one. */
export interface Passage {
  ar: string;
  en?: string;
}

/** A Supplication as listed in its Book; its text loads separately. */
export interface SupplicationSummary {
  /** Stable id: Daily Content, Favorites and Reading Completions refer to it. */
  id: string;
  /** The number shown beside the title (Sahifa 1–54); titles that already name their number (Nahj) have none. */
  number?: number;
  title: Localized;
}

export interface BookSection {
  id: string;
  title: Localized;
  supplications: SupplicationSummary[];
}

export interface Book {
  id: string;
  title: Localized;
  /** The content source; its notice is `notices/<source>.md`. */
  source: string;
  sourceUrl: string;
  sections: BookSection[];
}

/** A Supplication with the Book and section that hold it. */
export interface SupplicationEntry extends SupplicationSummary {
  bookId: string;
  sectionId: string;
}

/** What an a'mal entry asks of the Believer. */
export type AmalKind = "dua" | "ziyarah" | "prayer" | "fast" | "tasbih";

/** An act of a Hijri day or month, read from a bundled Supplication. */
export interface AmalEntry {
  /** The Hijri month, 1 (Muharram) to 12 (Dhu al-Hijja). */
  month: number;
  /** The day of the month; 0 means every day of the month. */
  day: number;
  kind: AmalKind;
  /** The night that begins the day (its eve), or the day itself; unset when either. */
  time?: "night" | "day";
  /** The Supplication that holds the text. */
  supplicationId: string;
}
