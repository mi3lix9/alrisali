import { AYAT, HIZB_QUARTER_STARTS } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/content/quran";
import type { Temporal } from "temporal-polyfill";

import { ayahPosition, NO_ADJUSTMENTS } from "./adjustments";
import type { KhatmahAdjustments } from "./adjustments";
import {
  khatmahDoneSessions,
  khatmahSessions,
  planEvery,
  sessionDueDate,
} from "./khatmah";
import type { Khatmah, KhatmahLog } from "./khatmah";

/**
 * How a Believer who is behind catches up: `extendEnd` pushes the end date
 * out and keeps the portions; `keepEnd` keeps the end date and enlarges the
 * portions still to read.
 */
export type RescheduleMode = "extendEnd" | "keepEnd";

export interface Rescheduled {
  adjust: KhatmahAdjustments;
  /**
   * The first session the new schedule renumbers. Logs of this session and
   * later ones belong to the old numbering, so they are removed.
   */
  fromSession: number;
}

const QUARTER_STARTS: readonly number[] = HIZB_QUARTER_STARTS.map((key) =>
  ayahPosition(key)
);

/**
 * The ayat from `first` to the end of the Quran in `count` portions of whole
 * hizb quarters (the first may start inside one), as even as they allow.
 */
const evenPortions = (first: number, count: number) => {
  const starts = [first, ...QUARTER_STARTS.filter((start) => start > first)];
  const units = starts.length;
  const portions = Math.min(count, units);
  return Array.from({ length: portions }, (_, index) => {
    const firstUnit = Math.floor((index * units) / portions);
    const lastUnit = Math.floor(((index + 1) * units) / portions) - 1;
    const last =
      lastUnit === units - 1
        ? AYAT.length - 1
        : (starts[lastUnit + 1] ?? AYAT.length) - 1;
    const from = AYAT[starts[firstUnit] ?? first];
    const to = AYAT[last];
    if (!(from && to)) {
      throw new Error("A Khatmah Session has no ayat");
    }
    return { from: from.key, to: to.key };
  });
};

/**
 * The new schedule for the sessions not yet done, or null when there is
 * nothing left to read or, for `keepEnd`, the end date has already passed.
 * The first remaining session is due today (or on its own date when that
 * is later), later ones follow at the plan's interval.
 */
export const reschedule = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  mode: RescheduleMode,
  today: Temporal.PlainDate
): Rescheduled | null => {
  const sessions = khatmahSessions(khatmah, logs);
  const done = khatmahDoneSessions(khatmah, logs);
  const remaining = sessions.filter(({ number }) => !done.has(number));
  const [first] = remaining;
  if (!first) {
    return null;
  }
  const every = planEvery(khatmah.plan);
  const dueFirst = sessionDueDate(khatmah, first.number);
  const start = today.since(dueFirst).sign > 0 ? today : dueFirst;

  let portions = remaining.map(({ from, to }) => ({ from, to }));
  if (mode === "keepEnd") {
    const end = sessionDueDate(khatmah, sessions.length);
    if (end.until(start).sign > 0) {
      return null;
    }
    const slots =
      Math.floor(start.until(end, { largestUnit: "days" }).days / every) + 1;
    portions = evenPortions(
      ayahPosition(first.from),
      Math.min(slots, remaining.length)
    );
  }

  return {
    fromSession: first.number,
    adjust: {
      segments: [
        ...(khatmah.adjust?.segments ?? []).filter(
          (segment) => segment.from < first.number
        ),
        { from: first.number, start, every, portions },
      ],
      partial: null,
    },
  };
};

export interface MarkedDoneTill {
  /** Sessions the read wholly covers, to log on the day it was marked. */
  logs: KhatmahLog[];
  adjust: KhatmahAdjustments;
}

/**
 * Marks everything up to and including `till` as read: the sessions it
 * wholly covers are completed and the one it ends inside keeps what was
 * read, so only the rest of it is left. Null when `till` is not past what
 * was read already.
 */
export const markDoneTill = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  till: AyahKey,
  today: Temporal.PlainDate
): MarkedDoneTill | null => {
  const done = khatmahDoneSessions(khatmah, logs);
  const tillPosition = ayahPosition(till);
  const completed: KhatmahLog[] = [];
  let partial: KhatmahAdjustments["partial"] = null;
  for (const session of khatmahSessions(khatmah, logs)) {
    if (done.has(session.number)) {
      continue;
    }
    if (tillPosition >= ayahPosition(session.to)) {
      completed.push({
        khatmahId: khatmah.id,
        session: session.number,
        date: today,
      });
    } else {
      if (tillPosition >= ayahPosition(session.from)) {
        partial = { session: session.number, till };
      }
      break;
    }
  }
  if (completed.length === 0 && partial === null) {
    return null;
  }
  return {
    logs: completed,
    adjust: { ...(khatmah.adjust ?? NO_ADJUSTMENTS), partial },
  };
};

/** The last ayah on a Quran Page: where "till the end of the page" ends. */
export const lastAyahOnPage = (page: number): AyahKey | undefined =>
  AYAT.findLast((ayah) => ayah.page === page)?.key;

/** The session whose portion holds `ayah`, with its last ayah. */
export const portionEndContaining = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  ayah: AyahKey
): AyahKey | undefined => {
  const position = ayahPosition(ayah);
  return khatmahSessions(khatmah, logs).find(
    (session) =>
      ayahPosition(session.from) <= position &&
      position <= ayahPosition(session.to)
  )?.to;
};
