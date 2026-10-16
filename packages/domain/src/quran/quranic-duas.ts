import {
  AYAT,
  QURANIC_DUA_ROWS,
  QURANIC_DUA_SPEAKERS,
  QURANIC_DUA_SUBJECTS,
} from "@alrisali/content/quran";
import type {
  QuranicDuaSpeaker,
  QuranicDuaSubject,
} from "@alrisali/content/quran";

import type { Ayah, AyahKey } from "./mushaf";
import type { RecitationEvent, RecitationPlayback } from "./recitation";

// The Quranic Duas list: the supplications the Quran reports, each with who
// made it and what it asks for, filterable and playable one after another.
// A dua is a reference into the bundled mushaf; its words are the ayat's.

export {
  QURANIC_DUA_SPEAKERS,
  QURANIC_DUA_SUBJECTS,
} from "@alrisali/content/quran";
export type {
  QuranicDuaSpeaker,
  QuranicDuaSubject,
} from "@alrisali/content/quran";

/** A run of ayat within one surah, recited as one piece. */
export interface DuaRange {
  /** Stable id: the first ayah, with `-` and the last ayah's number when it spans several (`2:127-128`). */
  id: string;
  from: AyahKey;
  to: AyahKey;
}

export interface QuranicDua extends DuaRange {
  speaker: QuranicDuaSpeaker;
  subject: QuranicDuaSubject;
}

const ayahIndex = new Map<string, number>(
  AYAT.map((ayah, index) => [ayah.key, index])
);

/** The range of ayat from `from` to `to`, with its id. */
export const duaRange = (from: AyahKey, to: AyahKey): DuaRange => ({
  id: from === to ? from : `${from}-${to.split(":")[1]}`,
  from,
  to,
});

/** Every Quranic dua, in mushaf order. */
export const QURANIC_DUAS: readonly QuranicDua[] = QURANIC_DUA_ROWS.map(
  ([from, to, speaker, subject]) => ({
    ...duaRange(from, to),
    speaker,
    subject,
  })
);

/** The ayat from `from` to `to`, inclusive; empty when either is not an ayah. */
export const ayatBetween = (from: AyahKey, to: AyahKey): readonly Ayah[] => {
  const start = ayahIndex.get(from);
  const end = ayahIndex.get(to);
  return start === undefined || end === undefined || end < start
    ? []
    : AYAT.slice(start, end + 1);
};

export interface QuranicDuaFilter {
  speaker?: QuranicDuaSpeaker | null;
  subject?: QuranicDuaSubject | null;
}

/** The duas by one speaker and/or about one subject; no filter lists them all. */
export const filterQuranicDuas = (
  filter: QuranicDuaFilter = {},
  duas: readonly QuranicDua[] = QURANIC_DUAS
): QuranicDua[] =>
  duas.filter(
    (dua) =>
      (!filter.speaker || dua.speaker === filter.speaker) &&
      (!filter.subject || dua.subject === filter.subject)
  );

/** The speakers (in list order) and subjects that have a dua among `duas`. */
export const quranicDuaFacets = (
  duas: readonly QuranicDua[] = QURANIC_DUAS
): {
  speakers: QuranicDuaSpeaker[];
  subjects: QuranicDuaSubject[];
} => ({
  speakers: QURANIC_DUA_SPEAKERS.filter((speaker) =>
    duas.some((dua) => dua.speaker === speaker)
  ),
  subjects: QURANIC_DUA_SUBJECTS.filter((subject) =>
    duas.some((dua) => dua.subject === subject)
  ),
});

/**
 * The event that recites one dua from its first to its last ayah, then
 * stops: the plan must not ask "continue to the next ayat?" at the end, since
 * the list goes on to the next dua itself.
 */
export const playDuaEvent = (
  dua: DuaRange,
  reciter: string
): Extract<RecitationEvent, { type: "play" }> => {
  // `settings` is the memorisation playback's plan settings; it is built
  // apart from the event so the event type stays the one recitation defines.
  const event = {
    type: "play" as const,
    ayah: dua.from,
    reciter,
    to: { kind: "ayah" as const, ayah: dua.to },
    settings: { askToContinueAtEnd: false },
  };
  return event;
};

/** The duas being played as a list, in order, and which one is reciting. */
export interface DuaQueue {
  duas: readonly DuaRange[];
  index: number;
}

export const startDuaQueue = (duas: readonly DuaRange[]): DuaQueue | null =>
  duas.length > 0 ? { duas, index: 0 } : null;

export interface DuaQueueStep {
  /** The queue after the step; null once it finished or was left. */
  queue: DuaQueue | null;
  /** The dua to start now, when the one before it has been recited. */
  play: DuaRange | null;
}

const within = (dua: DuaRange, ayah: AyahKey): boolean => {
  const at = ayahIndex.get(ayah);
  const start = ayahIndex.get(dua.from);
  const end = ayahIndex.get(dua.to);
  return (
    at !== undefined &&
    start !== undefined &&
    end !== undefined &&
    at >= start &&
    at <= end
  );
};

/**
 * What a change in recitation means for the queue. Recitation going quiet
 * from the current dua's last ayah means it was recited: the next dua starts,
 * or the queue ends after the last. Stopping, going quiet anywhere else, or reciting
 * something outside the current dua, means the Believer left the list.
 */
export const stepDuaQueue = (
  queue: DuaQueue | null,
  previous: RecitationPlayback,
  next: RecitationPlayback,
  event: RecitationEvent
): DuaQueueStep => {
  const current = queue?.duas[queue.index];
  if (!(queue && current)) {
    return { queue: null, play: null };
  }
  if (next.status === "idle") {
    // A Stop on the last ayah leaves the list; only reciting it to its end,
    // or skipping past it, goes on to the next dua.
    const finished =
      event.type !== "stop" &&
      previous.status !== "idle" &&
      previous.ayah === current.to;
    const following = queue.duas[queue.index + 1];
    if (finished && following) {
      return {
        queue: { duas: queue.duas, index: queue.index + 1 },
        play: following,
      };
    }
    return { queue: null, play: null };
  }
  return within(current, next.ayah)
    ? { queue, play: null }
    : { queue: null, play: null };
};

/** When the duas are recited: the Quran's own moments for a supplication. */
export const RECITATION_DUA_MOMENTS = [
  "before",
  "after",
  "completion",
] as const;
export type RecitationDuaMoment = (typeof RECITATION_DUA_MOMENTS)[number];

/**
 * Ayat to recite at each moment of reciting the Quran (in-house): seeking
 * refuge when beginning (16:98, and the dua of 23:97–98), asking for more
 * knowledge after (20:114), and the dua for this world and the next on
 * finishing (2:201). The ayat are the bundled Quran's; no other text.
 */
export const RECITATION_DUAS: Readonly<
  Record<RecitationDuaMoment, readonly DuaRange[]>
> = {
  before: [
    duaRange("16:98", "16:98"),
    duaRange("23:97", "23:98"),
    duaRange("20:25", "20:28"),
  ],
  after: [duaRange("20:114", "20:114")],
  completion: [duaRange("2:201", "2:201")],
};
