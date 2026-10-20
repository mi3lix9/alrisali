import { AYAT } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/content/quran";
import { Temporal } from "temporal-polyfill";
import { z } from "zod";

/*
 * What rescheduling and "Mark done till…" change about a Khatmah. They are
 * stored beside the plan, as an `adjust` key of the plan's JSON, so they need
 * no table of their own and sync with the Khatmah.
 */

/** One scheduled portion of a Khatmah: a run of ayat, first to last. */
export interface KhatmahSession {
  /** From 1. */
  number: number;
  from: AyahKey;
  to: AyahKey;
  /** The Quran Pages the portion touches, its first and last page included. */
  pages: number;
  firstPage: number;
  lastPage: number;
}

const POSITIONS = new Map<string, number>(
  AYAT.map((ayah, index) => [ayah.key, index])
);

/** Index of an ayah in the Quran, from 0; -1 for a key that is no ayah. */
export const ayahPosition = (key: string): number => POSITIONS.get(key) ?? -1;

/** The portion of ayat `first` to `last` (indices) as session `number`. */
export const portionOfAyat = (
  number: number,
  first: number,
  last: number
): KhatmahSession => {
  const from = AYAT[first];
  const to = AYAT[last];
  if (!(from && to) || last < first) {
    throw new Error("A Khatmah Session has no ayat");
  }
  return {
    number,
    from: from.key,
    to: to.key,
    pages: to.page - from.page + 1,
    firstPage: from.page,
    lastPage: to.page,
  };
};

/** Days between two sessions of a plan: daily, every other day or weekly. */
export type KhatmahEvery = 1 | 2 | 7;

/**
 * Sessions from `from` on that replace the plan's: the same ayat to the end
 * of the Quran, divided again. `start` is the date session `from` is due,
 * later ones follow `every` days apart.
 */
export interface KhatmahSegment {
  from: number;
  start: Temporal.PlainDate;
  every: KhatmahEvery;
  portions: readonly { from: AyahKey; to: AyahKey }[];
}

/** The part of a session read already, up to and including `till`. */
export interface KhatmahPartial {
  session: number;
  till: AyahKey;
}

export interface KhatmahAdjustments {
  /** In order of `from`, each replacing everything from its `from` on. */
  segments: readonly KhatmahSegment[];
  partial: KhatmahPartial | null;
}

export const NO_ADJUSTMENTS: KhatmahAdjustments = {
  segments: [],
  partial: null,
};

const ayahKeySchema = z
  .string()
  .refine((key): key is AyahKey => POSITIONS.has(key));

const storedSchema = z.object({
  segments: z
    .array(
      z.object({
        from: z.int().min(1),
        start: z.iso.date(),
        every: z.union([z.literal(1), z.literal(2), z.literal(7)]),
        portions: z
          .array(z.tuple([ayahKeySchema, ayahKeySchema]))
          .min(1)
          .max(AYAT.length),
      })
    )
    .default([]),
  partial: z
    .object({ session: z.int().min(1), till: ayahKeySchema })
    .nullable()
    .default(null),
});

const isAdjusted = (adjust: KhatmahAdjustments): boolean =>
  adjust.segments.length > 0 || adjust.partial !== null;

/** The adjustments stored with a plan's JSON; none when absent or unreadable. */
export const readKhatmahAdjustments = (stored: string): KhatmahAdjustments => {
  try {
    const parsed: unknown = JSON.parse(stored);
    const raw =
      typeof parsed === "object" && parsed !== null && "adjust" in parsed
        ? parsed.adjust
        : undefined;
    const result = storedSchema.safeParse(raw);
    if (!(raw && result.success)) {
      return NO_ADJUSTMENTS;
    }
    return {
      segments: result.data.segments.map((segment) => ({
        from: segment.from,
        start: Temporal.PlainDate.from(segment.start),
        every: segment.every,
        portions: segment.portions.map(([from, to]) => ({ from, to })),
      })),
      partial: result.data.partial,
    };
  } catch {
    return NO_ADJUSTMENTS;
  }
};

/**
 * A plan's stored JSON with `adjust` set (or removed, when it adjusts
 * nothing). The plan's own keys are left as they are.
 */
export const withKhatmahAdjustments = (
  storedPlan: string,
  adjust: KhatmahAdjustments
): string => {
  const plan: unknown = JSON.parse(storedPlan);
  if (typeof plan !== "object" || plan === null) {
    throw new Error("A stored plan is an object");
  }
  const { adjust: _previous, ...rest } = plan as Record<string, unknown>;
  if (!isAdjusted(adjust)) {
    return JSON.stringify(rest);
  }
  return JSON.stringify({
    ...rest,
    adjust: {
      segments: adjust.segments.map((segment) => ({
        from: segment.from,
        start: segment.start.toString(),
        every: segment.every,
        portions: segment.portions.map(({ from, to }) => [from, to]),
      })),
      partial: adjust.partial,
    },
  });
};

/** `base` with every segment laid over it, renumbered from 1. */
export const applySegments = (
  base: readonly KhatmahSession[],
  segments: readonly KhatmahSegment[]
): KhatmahSession[] => {
  let sessions = [...base];
  for (const segment of segments) {
    sessions = sessions.slice(0, segment.from - 1);
    for (const [offset, { from, to }] of segment.portions.entries()) {
      sessions.push(
        portionOfAyat(
          segment.from + offset,
          ayahPosition(from),
          ayahPosition(to)
        )
      );
    }
  }
  return sessions;
};

/**
 * `sessions` with the read part of the partially read session cut off: it
 * starts at the ayah after `till`. Not applied once `done` holds that session.
 */
export const trimPartial = (
  sessions: readonly KhatmahSession[],
  partial: KhatmahPartial | null,
  done: ReadonlySet<number>
): KhatmahSession[] =>
  sessions.map((session) => {
    if (!partial || partial.session !== session.number) {
      return session;
    }
    const till = ayahPosition(partial.till);
    const first = ayahPosition(session.from);
    const last = ayahPosition(session.to);
    if (done.has(session.number) || till < first || till >= last) {
      return session;
    }
    return portionOfAyat(session.number, till + 1, last);
  });

/** The date session `number` is due after a segment, or null before them. */
export const segmentDueDate = (
  segments: readonly KhatmahSegment[],
  number: number
): Temporal.PlainDate | null => {
  const segment = segments.findLast(({ from }) => from <= number);
  return segment
    ? segment.start.add({ days: (number - segment.from) * segment.every })
    : null;
};
