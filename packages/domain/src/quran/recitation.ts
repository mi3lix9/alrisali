import { AYAT } from "@alrisali/content/quran";
import type { Temporal } from "temporal-polyfill";

import { ayatOfSurah, findAyah, firstAyahOfPage } from "./mushaf";
import type { Ayah, AyahKey } from "./mushaf";
import type { QuranReaderState } from "./reader";

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

/** How long a played file stays on the device. */
export const RECITATION_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** One ayah as one reciter recites it. */
export interface RecitedAyah {
  reciterId: number;
  ayah: AyahKey;
}

export interface CachedRecitation {
  /** `<reciterId>/<sss><aaa>`, e.g. `7/002255`. */
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
   * old, otherwise the stream `remote` resolves (only asked for then).
   */
  source: (
    recited: RecitedAyah,
    remote: () => Promise<string>
  ) => Promise<string>;
  /** Keeps a played file for 7 days from its download. */
  keep: (recited: RecitedAyah, url: string) => Promise<void>;
  /** Deletes every file 7 days old or older. */
  prune: () => Promise<void>;
}

const cacheKey = ({ reciterId, ayah }: RecitedAyah): string => {
  const [surah = "", number = ""] = ayah.split(":");
  return `${reciterId}/${surah.padStart(3, "0")}${number.padStart(3, "0")}`;
};

/** Played recitation files, kept on the device for at most 7 days. */
export const createRecitationCache = ({
  store,
  now = Date.now,
}: RecitationCacheOptions): RecitationCache => {
  const isFresh = ({ savedAt }: CachedRecitation) =>
    now() - savedAt < RECITATION_CACHE_MAX_AGE_MS;

  return {
    source: async (recited, remote) => {
      const key = cacheKey(recited);
      const entry = await store.get(key);
      if (entry && isFresh(entry)) {
        return entry.uri;
      }
      if (entry) {
        await store.remove(key);
      }
      return remote();
    },
    keep: async (recited, url) => {
      const key = cacheKey(recited);
      const entry = await store.get(key);
      if (entry && isFresh(entry)) {
        return;
      }
      await store.save(key, url);
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

/** Recitation as the player sees it; the device's audio follows it. */
export type RecitationPlayback =
  | { status: "idle" }
  | {
      status: "loading" | "playing" | "paused" | "error";
      ayah: AyahKey;
      reciterId: number;
      /** The last ayah to play; null plays on to the end of the Quran. */
      until: AyahKey | null;
    };

export type RecitationEvent =
  /** Start at an ayah, replacing whatever was playing. */
  | { type: "play"; ayah: AyahKey; reciterId: number; until?: AyahKey }
  /** The current ayah's audio loaded and started. */
  | { type: "ready" }
  /** The current ayah's audio ended. */
  | { type: "finished" }
  | { type: "failed" }
  | { type: "pause" }
  /** Continue after a pause, or retry after a failure. */
  | { type: "resume" }
  | { type: "stop" };

const IDLE: RecitationPlayback = { status: "idle" };

export const recitationPlayback = (
  state: RecitationPlayback,
  event: RecitationEvent
): RecitationPlayback => {
  if (event.type === "play") {
    return {
      status: "loading",
      ayah: event.ayah,
      reciterId: event.reciterId,
      until: event.until ?? null,
    };
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
      if (state.status !== "playing") {
        return state;
      }
      const next = state.ayah === state.until ? null : nextAyah(state.ayah);
      return next ? { ...state, status: "loading", ayah: next } : IDLE;
    }
    case "failed": {
      return { ...state, status: "error" };
    }
    case "pause": {
      return state.status === "playing" || state.status === "loading"
        ? { ...state, status: "paused" }
        : state;
    }
    case "resume": {
      if (state.status === "paused") {
        return { ...state, status: "playing" };
      }
      return state.status === "error" ? { ...state, status: "loading" } : state;
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
