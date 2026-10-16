import { AYAT } from "@alrisali/content/quran";
import type { Temporal } from "temporal-polyfill";

import { ayatOfSurah, findAyah, firstAyahOfPage } from "./mushaf";
import type { Ayah, AyahKey } from "./mushaf";
import { playbackPlan, playToEnd } from "./playback-plan";
import type {
  PauseAfterAyah,
  PlaybackPlan,
  PlaybackSettings,
  PlayTo,
  RepeatCount,
} from "./playback-plan";
import type { QuranReaderState } from "./reader";
import { recitationUrl } from "./reciters";

// Recitation: which ayah it starts at, the order it plays in, and how long a
// played file is kept on the device.

const ayahIndex = new Map<string, number>(
  AYAT.map((ayah, index) => [ayah.key, index])
);

/**
 * The first ayah on screen, where recitation starts: the first ayah printed
 * on the page in Page Mode; in Surah Mode the ayah scrolled to the top, or
 * the surah's first ayah until one is.
 */
export const recitationStart = (state: QuranReaderState): AyahKey => {
  if (state.mode === "page") {
    return firstAyahOfPage(state.currentPage).key;
  }
  const shown = state.lastReadAyah ? findAyah(state.lastReadAyah) : undefined;
  if (shown?.surah === state.currentSurah) {
    return shown.key;
  }
  const [first] = ayatOfSurah(state.currentSurah);
  if (!first) {
    throw new RangeError(`Surah ${state.currentSurah} holds no ayah`);
  }
  return first.key;
};

/** The ayah recited after this one, into the next surah; null after 114:6. */
export const nextAyah = (key: AyahKey): AyahKey | null => {
  const index = ayahIndex.get(key);
  if (index === undefined) {
    throw new RangeError(`No ayah ${key}`);
  }
  return AYAT[index + 1]?.key ?? null;
};

/** The ayah before this one, back into the previous surah; null before 1:1. */
export const previousAyah = (key: AyahKey): AyahKey | null => {
  const index = ayahIndex.get(key);
  if (index === undefined) {
    throw new RangeError(`No ayah ${key}`);
  }
  return AYAT[index - 1]?.key ?? null;
};

/** How long a played file stays on the device. */
export const RECITATION_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** One ayah as one bundled reciter recites it. */
export interface RecitedAyah {
  /** A bundled reciter's key, e.g. `ar.alafasy`. */
  reciter: string;
  ayah: AyahKey;
}

export interface CachedRecitation {
  /** `<reciter>/<sss><aaa>`, e.g. `ar.alafasy/002255`. */
  key: string;
  /** Where the file is on the device. */
  uri: string;
  /** Epoch milliseconds the file was downloaded. */
  savedAt: number;
}

/** The audio files on the device; the app keeps them in its cache directory. */
export interface RecitationCacheStore {
  get: (key: string) => Promise<CachedRecitation | null>;
  list: () => Promise<CachedRecitation[]>;
  /** Downloads the file at `url` under `key`, replacing any older copy. */
  save: (key: string, url: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

export interface RecitationCacheOptions {
  store: RecitationCacheStore;
  now?: () => number;
}

export interface RecitationCache {
  /**
   * Where to play an ayah from: its file on the device while under 7 days
   * old, otherwise its reciter's stream.
   */
  source: (recited: RecitedAyah) => Promise<string>;
  /** Downloads a played ayah from its reciter's stream and keeps it 7 days. */
  keep: (recited: RecitedAyah) => Promise<void>;
  /** Deletes every file 7 days old or older. */
  prune: () => Promise<void>;
}

const cacheKey = ({ reciter, ayah }: RecitedAyah): string => {
  const [surah = "", number = ""] = ayah.split(":");
  return `${reciter}/${surah.padStart(3, "0")}${number.padStart(3, "0")}`;
};

/** Played recitation files, kept on the device for at most 7 days. */
export const createRecitationCache = ({
  store,
  now = Date.now,
}: RecitationCacheOptions): RecitationCache => {
  const isFresh = ({ savedAt }: CachedRecitation) =>
    now() - savedAt < RECITATION_CACHE_MAX_AGE_MS;

  return {
    source: async (recited) => {
      const key = cacheKey(recited);
      const entry = await store.get(key);
      if (entry && isFresh(entry)) {
        return entry.uri;
      }
      if (entry) {
        await store.remove(key);
      }
      return recitationUrl(recited.reciter, recited.ayah);
    },
    keep: async (recited) => {
      const key = cacheKey(recited);
      const entry = await store.get(key);
      if (entry && isFresh(entry)) {
        return;
      }
      await store.save(key, recitationUrl(recited.reciter, recited.ayah));
    },
    prune: async () => {
      const entries = await store.list();
      await Promise.all(
        entries
          .filter((entry) => !isFresh(entry))
          .map((entry) => store.remove(entry.key))
      );
    },
  };
};

/** Who started recitation: the reader plays on its own; Home's Verse of the Day plays one ayah. */
export type PlaybackOrigin = "reader" | "verse-of-the-day";

/** Recitation as the player sees it; the device's audio follows it. */
export type RecitationPlayback =
  | { status: "idle" }
  | {
      /**
       * `pausing` is the silence after an ayah; `awaiting-continue` is the end
       * of the range, waiting for the Believer's answer to "continue to the
       * next ayat?".
       */
      status:
        | "loading"
        | "playing"
        | "paused"
        | "pausing"
        | "awaiting-continue"
        | "error";
      /** The ayah being recited now (while pausing, the one coming next). */
      ayah: AyahKey;
      reciter: string;
      origin: PlaybackOrigin;
      /** What was asked: where it started, where it stops, and how. */
      plan: PlaybackPlan;
      /** Which time round the current ayah is, from 1. */
      ayahPass: number;
      /** Which time round the range is, from 1. */
      rangePass: number;
      /** Seconds of silence a `pausing` state waits; null otherwise. */
      pauseSeconds: number | null;
      /** Epoch milliseconds the sleep timer stops recitation; null when off. */
      sleepAt: number | null;
    };

export type RecitationEvent =
  /**
   * Start at an ayah, replacing whatever was playing; `to` defaults to the end
   * of the Quran. `now` (epoch milliseconds) starts the sleep timer.
   */
  | {
      type: "play";
      ayah: AyahKey;
      reciter: string;
      to?: PlayTo;
      origin?: PlaybackOrigin;
      settings?: PlaybackSettings;
      now?: number;
    }
  /** The current ayah's audio loaded and started. */
  | { type: "ready" }
  /** The current ayah's audio ended; its length sets an ayah-length pause. */
  | { type: "finished"; durationSeconds?: number }
  | { type: "failed" }
  | { type: "pause" }
  /** Continue after a pause, or retry after a failure. */
  | { type: "resume" }
  /** The silence after an ayah is over. */
  | { type: "pauseElapsed" }
  /** The clock moved on; the sleep timer may be up. */
  | { type: "tick"; now: number }
  /** Answer "yes" to "continue to the next ayat?". */
  | { type: "continue" }
  /** Recite the current ayah in another voice; the plan carries on. */
  | { type: "reciter"; reciter: string }
  /** Jump to the next or previous ayah, within the plan's range going forward. */
  | { type: "skip"; direction: "next" | "previous" }
  | { type: "stop" };

const IDLE: RecitationPlayback = { status: "idle" };

type Playing = Exclude<RecitationPlayback, { status: "idle" }>;

const repeatsLeft = (pass: number, count: RepeatCount): boolean =>
  count === "infinite" || pass < count;

/** Seconds of silence after an ayah `durationSeconds` long; 0 for none. */
const pauseLength = (
  pause: PauseAfterAyah,
  durationSeconds: number | undefined
): number => {
  switch (pause.kind) {
    case "seconds": {
      return Math.max(0, pause.seconds);
    }
    case "ayahLength": {
      return Math.max(0, pause.factor * (durationSeconds ?? 0));
    }
    default: {
      return 0;
    }
  }
};

/** The state that plays on after an ayah: silence first when the plan pauses. */
const playOn = (
  state: Playing,
  position: Partial<Pick<Playing, "ayah" | "ayahPass" | "rangePass">>,
  durationSeconds: number | undefined
): Playing => {
  const seconds = pauseLength(state.plan.pause, durationSeconds);
  return seconds > 0
    ? { ...state, ...position, status: "pausing", pauseSeconds: seconds }
    : { ...state, ...position, status: "loading", pauseSeconds: null };
};

/**
 * What follows the ayah that just finished: its next repeat, the next ayah,
 * the range's next repeat, the end-of-range question, or nothing.
 */
const afterAyah = (
  state: Playing,
  durationSeconds: number | undefined
): RecitationPlayback => {
  const { plan } = state;
  if (repeatsLeft(state.ayahPass, plan.ayahRepeat)) {
    return playOn(state, { ayahPass: state.ayahPass + 1 }, durationSeconds);
  }
  const found = findAyah(state.ayah);
  if (
    plan.sleep.kind === "endOfSurah" &&
    found &&
    ayatOfSurah(found.surah).at(-1)?.key === state.ayah
  ) {
    return IDLE;
  }
  const end = playToEnd(plan.from, plan.to);
  const following = state.ayah === end ? null : nextAyah(state.ayah);
  if (following) {
    return playOn(state, { ayah: following, ayahPass: 1 }, durationSeconds);
  }
  if (repeatsLeft(state.rangePass, plan.rangeRepeat)) {
    return playOn(
      state,
      { ayah: plan.from, ayahPass: 1, rangePass: state.rangePass + 1 },
      durationSeconds
    );
  }
  if (plan.askToContinueAtEnd && nextAyah(state.ayah) !== null) {
    return { ...state, status: "awaiting-continue", pauseSeconds: null };
  }
  return IDLE;
};

/**
 * Where "continue to the next ayat?" goes: the same kind of range from the
 * ayah after this one (a chosen-ayah range keeps its length).
 */
const continued = (state: Playing): RecitationPlayback => {
  const next = nextAyah(state.ayah);
  if (!next) {
    return IDLE;
  }
  const { plan } = state;
  let { to } = plan;
  if (to.kind === "ayah") {
    const length =
      (ayahIndex.get(to.ayah) ?? 0) - (ayahIndex.get(plan.from) ?? 0) + 1;
    const last = AYAT.at(-1)?.key ?? next;
    const endIndex = Math.min(
      (ayahIndex.get(next) ?? 0) + length - 1,
      ayahIndex.get(last) ?? 0
    );
    to = { kind: "ayah", ayah: AYAT[endIndex]?.key ?? last };
  }
  return {
    ...state,
    status: "loading",
    ayah: next,
    plan: { ...plan, from: next, to },
    ayahPass: 1,
    rangePass: 1,
    pauseSeconds: null,
  };
};

const skip = (state: Playing, direction: "next" | "previous") => {
  if (state.status === "awaiting-continue" && direction === "next") {
    return state;
  }
  const moved = (ayah: AyahKey): Playing => ({
    ...state,
    status: "loading",
    ayah,
    ayahPass: 1,
    pauseSeconds: null,
  });
  if (direction === "previous") {
    const previous = previousAyah(state.ayah);
    return previous ? moved(previous) : state;
  }
  const end = playToEnd(state.plan.from, state.plan.to);
  const following = state.ayah === end ? null : nextAyah(state.ayah);
  return following ? moved(following) : IDLE;
};

const started = (event: Extract<RecitationEvent, { type: "play" }>) => {
  const origin = event.origin ?? "reader";
  const plan = playbackPlan(event.ayah, event.to, {
    ...event.settings,
    // Home's Verse of the Day is one ayah: nothing to continue to.
    ...(origin === "reader" ? {} : { askToContinueAtEnd: false }),
  });
  return {
    status: "loading" as const,
    ayah: event.ayah,
    reciter: event.reciter,
    origin,
    plan,
    ayahPass: 1,
    rangePass: 1,
    pauseSeconds: null,
    sleepAt:
      plan.sleep.kind === "minutes"
        ? (event.now ?? Date.now()) + plan.sleep.minutes * 60_000
        : null,
  };
};

/** The events that move the current ayah between loading, playing, paused and error. */
const changeStatus = (
  state: Playing,
  event: Extract<
    RecitationEvent,
    { type: "reciter" | "failed" | "pause" | "resume" }
  >
): RecitationPlayback => {
  switch (event.type) {
    case "reciter": {
      return state.status === "awaiting-continue"
        ? { ...state, reciter: event.reciter }
        : {
            ...state,
            status: "loading",
            reciter: event.reciter,
            pauseSeconds: null,
          };
    }
    case "failed": {
      return state.status === "pausing" || state.status === "awaiting-continue"
        ? state
        : { ...state, status: "error" };
    }
    case "pause": {
      return state.status === "playing" ||
        state.status === "loading" ||
        state.status === "pausing"
        ? { ...state, status: "paused" }
        : state;
    }
    case "resume": {
      if (state.status === "paused") {
        return {
          ...state,
          status: state.pauseSeconds === null ? "playing" : "pausing",
        };
      }
      return state.status === "error" ? { ...state, status: "loading" } : state;
    }
    default: {
      return state;
    }
  }
};

export const recitationPlayback = (
  state: RecitationPlayback,
  event: RecitationEvent
): RecitationPlayback => {
  if (event.type === "play") {
    return started(event);
  }
  if (event.type === "stop" || state.status === "idle") {
    return IDLE;
  }
  switch (event.type) {
    case "ready": {
      return state.status === "loading"
        ? { ...state, status: "playing" }
        : state;
    }
    case "finished": {
      return state.status === "playing"
        ? afterAyah(state, event.durationSeconds)
        : state;
    }
    case "pauseElapsed": {
      return state.status === "pausing"
        ? { ...state, status: "loading", pauseSeconds: null }
        : state;
    }
    case "tick": {
      return state.sleepAt !== null && event.now >= state.sleepAt
        ? IDLE
        : state;
    }
    case "continue": {
      return state.status === "awaiting-continue" ? continued(state) : state;
    }
    case "skip": {
      return skip(state, event.direction);
    }
    case "reciter":
    case "failed":
    case "pause":
    case "resume": {
      return changeStatus(state, event);
    }
    default: {
      return state;
    }
  }
};

/** The Verse of the Day for each weekday, Monday first (`dayOfWeek` 1–7). */
const VERSES_OF_THE_DAY: readonly AyahKey[] = [
  "65:3",
  "12:87",
  "2:152",
  "17:81",
  "94:5",
  "20:114",
  "2:153",
];

/** The ayah Home features on a day: one fixed ayah for each weekday. */
export const verseOfTheDay = (date: Temporal.PlainDate): Ayah => {
  const key = VERSES_OF_THE_DAY[date.dayOfWeek - 1];
  const ayah = key ? findAyah(key) : undefined;
  if (!ayah) {
    throw new RangeError(`No Verse of the Day for ${date.toString()}`);
  }
  return ayah;
};
