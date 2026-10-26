/** The muezzins whose recordings a Believer can choose for the Adhan voice. */
export const MUEZZINS = ["hatamzadeh", "sobhdel"] as const;

export type Muezzin = (typeof MUEZZINS)[number];

/**
 * How much of the Adhan a recording holds: the opening takbeer only (short
 * enough for any notification sound) or the whole Shia Adhan.
 */
export const ADHAN_FORMS = ["takbeer", "full"] as const;

export type AdhanForm = (typeof ADHAN_FORMS)[number];

/** One recording of the Adhan: a muezzin and how much of it. */
export interface Adhan {
  id: AdhanId;
  muezzin: Muezzin;
  form: AdhanForm;
}

export const ADHAN_IDS = [
  "hatamzadeh-takbeer",
  "hatamzadeh-full",
  "sobhdel-takbeer",
  "sobhdel-full",
] as const;

export type AdhanId = (typeof ADHAN_IDS)[number];

/** A short opening, so a Believer who only switched the voice on gets a sound that fits any device. */
export const DEFAULT_ADHAN: AdhanId = "hatamzadeh-takbeer";

const ADHAN_BY_ID: Record<AdhanId, Adhan> = {
  "hatamzadeh-takbeer": {
    id: "hatamzadeh-takbeer",
    muezzin: "hatamzadeh",
    form: "takbeer",
  },
  "hatamzadeh-full": {
    id: "hatamzadeh-full",
    muezzin: "hatamzadeh",
    form: "full",
  },
  "sobhdel-takbeer": {
    id: "sobhdel-takbeer",
    muezzin: "sobhdel",
    form: "takbeer",
  },
  "sobhdel-full": { id: "sobhdel-full", muezzin: "sobhdel", form: "full" },
};

/** Every recording, in the order they are offered. */
export const ADHANS: readonly Adhan[] = ADHAN_IDS.map((id) => ADHAN_BY_ID[id]);

export const adhanOf = (id: AdhanId): Adhan => ADHAN_BY_ID[id];

/** The same muezzin's takbeer recording, for devices that cannot play the full one. */
export const takbeerOf = (id: AdhanId): AdhanId =>
  `${adhanOf(id).muezzin}-takbeer`;
