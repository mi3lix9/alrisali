import { AYAT } from "@alrisali/content/quran";

import {
  ayatOfSurah,
  ayatOnPage,
  findAyah,
  firstAyahOfJuz,
  JUZ_COUNT,
} from "./mushaf";
import type { AyahKey } from "./mushaf";

// A playback plan: what the Believer asked recitation to play. Play To
// resolves its end from mushaf metadata. Memorisation (repeats, pause, speed,
// sleep) hangs off the same plan.

export type RepeatCount = 1 | 2 | 3 | 5 | 10 | "infinite";

export type PauseAfterAyah =
  | { kind: "none" }
  | { kind: "seconds"; seconds: number }
  /** Silence as long as the ayah just recited, times `factor`. */
  | { kind: "ayahLength"; factor: 0.5 | 1 | 1.5 | 2 };

/**
 * Where recitation stops. `page`, `surah` and `juz` mean the end of the one
 * the plan starts in; `ayah` is a chosen ayah; `quran` is plain Play, which
 * goes on to the end of the Quran.
 */
export type PlayTo =
  | { kind: "page" }
  | { kind: "surah" }
  | { kind: "juz" }
  | { kind: "ayah"; ayah: AyahKey }
  | { kind: "quran" };

export type SleepTimer =
  | { kind: "off" }
  | { kind: "minutes"; minutes: 15 | 30 | 60 }
  | { kind: "endOfSurah" };

export interface PlaybackPlan {
  from: AyahKey;
  to: PlayTo;
  ayahRepeat: RepeatCount;
  rangeRepeat: RepeatCount;
  pause: PauseAfterAyah;
  /** 0.75 to 1.5. */
  speed: number;
  sleep: SleepTimer;
  /** Ask "continue to the next ayat?" when the range ends. */
  askToContinueAtEnd: boolean;
}

export const MIN_PLAYBACK_SPEED = 0.75;
export const MAX_PLAYBACK_SPEED = 1.5;

/** Play To's four ends, in the order the form lists them. */
export const PLAY_TO_KINDS = ["page", "surah", "juz", "ayah"] as const;

/** What the Believer sets besides where playback starts and stops. */
export type PlaybackSettings = Partial<Omit<PlaybackPlan, "from" | "to">>;

/** The repeat counts the form offers, in order. */
export const REPEAT_COUNTS: readonly RepeatCount[] = [
  1,
  2,
  3,
  5,
  10,
  "infinite",
];

/** The speeds the form offers, in order. */
export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5] as const;

/** The multiples of an ayah's length the pause offers, in order. */
export const AYAH_LENGTH_FACTORS = [0.5, 1, 1.5, 2] as const;

/** The sleep timers the form offers, in order. */
export const SLEEP_TIMERS: readonly SleepTimer[] = [
  { kind: "off" },
  { kind: "endOfSurah" },
  { kind: "minutes", minutes: 15 },
  { kind: "minutes", minutes: 30 },
  { kind: "minutes", minutes: 60 },
];

const clampSpeed = (speed: number): number =>
  Math.min(MAX_PLAYBACK_SPEED, Math.max(MIN_PLAYBACK_SPEED, speed));

/**
 * A plan that plays `from` once, at normal speed, up to the end `to` names;
 * `settings` change the repeats, pause, speed, sleep timer and end prompt.
 * Speed is held to 0.75–1.5.
 */
export const playbackPlan = (
  from: AyahKey,
  to?: PlayTo,
  settings: PlaybackSettings = {}
): PlaybackPlan => ({
  from,
  to: to ?? { kind: "quran" },
  ayahRepeat: settings.ayahRepeat ?? 1,
  rangeRepeat: settings.rangeRepeat ?? 1,
  pause: settings.pause ?? { kind: "none" },
  speed: clampSpeed(settings.speed ?? 1),
  sleep: settings.sleep ?? { kind: "off" },
  askToContinueAtEnd: settings.askToContinueAtEnd ?? true,
});

const isBefore = (a: AyahKey, b: AyahKey): boolean => {
  const first = findAyah(a);
  const second = findAyah(b);
  if (!(first && second)) {
    throw new RangeError(`No ayah ${first ? b : a}`);
  }
  return first.surah === second.surah
    ? first.ayah < second.ayah
    : first.surah < second.surah;
};

/** Whether `to` is an end a plan starting at `from` can reach. */
export const isPlayToReachable = (from: AyahKey, to: PlayTo): boolean => {
  if (to.kind !== "ayah") {
    return findAyah(from) !== undefined;
  }
  return findAyah(to.ayah) !== undefined && !isBefore(to.ayah, from);
};

/**
 * The last ayah a plan starting at `from` plays; null when it plays on to the
 * end of the Quran. Throws when `from` is not an ayah or a chosen ayah comes
 * before it.
 */
export const playToEnd = (from: AyahKey, to: PlayTo): AyahKey | null => {
  const start = findAyah(from);
  if (!start) {
    throw new RangeError(`No ayah ${from}`);
  }
  switch (to.kind) {
    case "quran": {
      return null;
    }
    case "page": {
      return ayatOnPage(start.page).at(-1)?.key ?? from;
    }
    case "surah": {
      return ayatOfSurah(start.surah).at(-1)?.key ?? from;
    }
    case "juz": {
      if (start.juz >= JUZ_COUNT) {
        return AYAT.at(-1)?.key ?? from;
      }
      const nextStart = firstAyahOfJuz(start.juz + 1);
      return AYAT[AYAT.indexOf(nextStart) - 1]?.key ?? from;
    }
    case "ayah": {
      if (!isPlayToReachable(from, to)) {
        throw new RangeError(`Cannot play ${from} to ${to.ayah}`);
      }
      return to.ayah;
    }
    default: {
      throw new RangeError("Unknown Play To");
    }
  }
};
