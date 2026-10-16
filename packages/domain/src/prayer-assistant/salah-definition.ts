import type { Salah } from "../shared";

/**
 * Which part of a longer prayer a segment is, for its name on screen: a
 * nafila prayed with an obligatory Salah, or the Shaf' and Witr that close
 * the Night prayer. Null is the prayer itself.
 */
export const SEGMENT_PARTS = ["nafila", "shaf", "witr"] as const;

export type SegmentPart = (typeof SEGMENT_PARTS)[number];

/** One prayer closed by its own Tashahhud and Tasleem. */
export interface Segment {
  rakahs: number;
  /** Ruku in each Rak'ah: one, or five in the Ayat prayer. */
  rukuPerRakah: number;
  /** The Rak'ah after which the Believer sits for a middle Tashahhud. */
  middleTashahhudAfter: number | null;
  /** Prayed seated, as the Watirah after Isha. */
  seated: boolean;
  part: SegmentPart | null;
}

/** Every prayer the Prayer Assistant can follow, besides a Custom count. */
export const SALAH_TYPES = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
  "night",
  "ayat",
  "ghufayla",
  "friday",
  "eid",
  "ziyarah",
] as const;

export type SalahType = (typeof SALAH_TYPES)[number];

/**
 * A prayer as data: the segments the Believer prays in order. The rak'ah
 * machine walks its Positions; nothing about a prayer lives in code.
 */
export interface SalahDefinition {
  type: SalahType | "custom";
  /** The obligatory Salah it fulfils, so the Prayer Log ticks it; or null. */
  salah: Salah | null;
  /** Prayed together with the Salah's nafila. */
  nafila: boolean;
  segments: readonly Segment[];
}

const segment = (rakahs: number, extra: Partial<Segment> = {}): Segment => ({
  rakahs,
  rukuPerRakah: 1,
  // A three- or four-Rak'ah prayer sits after its second Rak'ah.
  middleTashahhudAfter: rakahs > 2 ? 2 : null,
  seated: false,
  part: null,
  ...extra,
});

const pairs = (count: number, extra: Partial<Segment> = {}) =>
  Array.from({ length: count }, () => segment(2, extra));

const fixed = (
  type: SalahType,
  segments: readonly Segment[],
  salah: Salah | null = null
): SalahDefinition => ({ type, salah, nafila: false, segments });

export const SALAH_DEFINITIONS = {
  fajr: fixed("fajr", [segment(2)], "fajr"),
  dhuhr: fixed("dhuhr", [segment(4)], "dhuhr"),
  asr: fixed("asr", [segment(4)], "asr"),
  maghrib: fixed("maghrib", [segment(3)], "maghrib"),
  isha: fixed("isha", [segment(4)], "isha"),
  // Eight Rak'ahs in pairs, then the Shaf' and a single Witr.
  night: fixed("night", [
    ...pairs(4),
    segment(2, { part: "shaf" }),
    segment(1, { part: "witr" }),
  ]),
  ayat: fixed("ayat", [segment(2, { rukuPerRakah: 5 })]),
  ghufayla: fixed("ghufayla", [segment(2)]),
  friday: fixed("friday", [segment(2)]),
  eid: fixed("eid", [segment(2)]),
  ziyarah: fixed("ziyarah", [segment(2)]),
} as const satisfies Record<SalahType, SalahDefinition>;

/**
 * Each Salah's daily nafila, prayed in pairs: before Fajr, Dhuhr and Asr,
 * after Maghrib and Isha. Isha's is the Watirah, two Rak'ahs seated.
 */
const NAFILA = {
  fajr: { segments: pairs(1, { part: "nafila" }), before: true },
  dhuhr: { segments: pairs(4, { part: "nafila" }), before: true },
  asr: { segments: pairs(4, { part: "nafila" }), before: true },
  maghrib: { segments: pairs(2, { part: "nafila" }), before: false },
  isha: { segments: pairs(1, { part: "nafila", seated: true }), before: false },
} as const satisfies Record<
  Salah,
  { segments: readonly Segment[]; before: boolean }
>;

/** An obligatory Salah prayed with its nafila, each in its place. */
export const withNafila = (salah: Salah): SalahDefinition => {
  const { segments, before } = NAFILA[salah];
  const own = SALAH_DEFINITIONS[salah].segments;
  return {
    type: salah,
    salah,
    nafila: true,
    segments: before ? [...segments, ...own] : [...own, ...segments],
  };
};

/** How many Rak'ahs a Custom prayer may have. */
export const CUSTOM_RAKAH_LIMITS = { min: 1, max: 12 } as const;

/** A recommended or vowed prayer of any count, prayed two Rak'ahs at a time. */
export const customSalah = (rakahs: number): SalahDefinition => {
  const count = Math.min(
    CUSTOM_RAKAH_LIMITS.max,
    Math.max(CUSTOM_RAKAH_LIMITS.min, Math.round(rakahs))
  );
  const segments = pairs(Math.floor(count / 2));
  return {
    type: "custom",
    salah: null,
    nafila: false,
    segments: count % 2 === 1 ? [...segments, segment(1)] : segments,
  };
};
