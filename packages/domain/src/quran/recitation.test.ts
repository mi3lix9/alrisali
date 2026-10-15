import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  createRecitationCache,
  DEFAULT_QURAN_READER_SETTINGS,
  nextAyah,
  openReader,
  readerReducer,
  recitationPlayback,
  recitationStart,
  verseOfTheDay,
} from ".";
import type {
  CachedRecitation,
  RecitationCacheStore,
  RecitationEvent,
  RecitationPlayback,
} from ".";

const pageMode = DEFAULT_QURAN_READER_SETTINGS;
const surahMode = { ...DEFAULT_QURAN_READER_SETTINGS, mode: "surah" as const };

describe(recitationStart, () => {
  it("starts Page Mode at the first ayah printed on the page, not the opened ayah", () => {
    // 2:255 sits on page 42, which opens at 2:253.
    const state = openReader({ settings: pageMode, ayah: "2:255" });
    expect(recitationStart(state)).toBe("2:253");
  });

  it("follows the page the Believer turned to", () => {
    const state = readerReducer(openReader({ settings: pageMode, page: 1 }), {
      type: "page-shown",
      page: 3,
    });
    expect(recitationStart(state)).toBe("2:6");
  });

  it("starts Surah Mode at the ayah scrolled to the top", () => {
    const state = readerReducer(
      openReader({ settings: surahMode, surah: 18 }),
      {
        type: "ayah-shown",
        ayah: "18:10",
      }
    );
    expect(recitationStart(state)).toBe("18:10");
  });

  it("starts Surah Mode at the surah's first ayah when nothing in it was shown", () => {
    const state = openReader({
      settings: surahMode,
      surah: 36,
      lastReadAyah: "2:255",
    });
    expect(recitationStart(state)).toBe("36:1");
  });
});

describe(nextAyah, () => {
  it("moves to the next ayah within a surah", () => {
    expect(nextAyah("1:6")).toBe("1:7");
  });

  it("moves on to the next surah after a surah's last ayah", () => {
    expect(nextAyah("1:7")).toBe("2:1");
    expect(nextAyah("2:286")).toBe("3:1");
  });

  it("ends after the last ayah of the Quran", () => {
    expect(nextAyah("114:6")).toBeNull();
  });
});

const DAY_MS = 24 * 60 * 60 * 1000;
const REMOTE = "https://verses.quran.foundation/Alafasy/mp3/002255.mp3";

/** An in-memory stand-in for the device's audio files. */
const memoryStore = () => {
  const files = new Map<string, number>();
  let clock = 0;
  const store: RecitationCacheStore = {
    get: (key) => {
      const savedAt = files.get(key);
      return Promise.resolve(
        savedAt === undefined
          ? null
          : { key, uri: `file:///${key}.mp3`, savedAt }
      );
    },
    list: () =>
      Promise.resolve(
        [...files].map(([key, savedAt]): CachedRecitation => ({
          key,
          uri: `file:///${key}.mp3`,
          savedAt,
        }))
      ),
    save: (key) => {
      files.set(key, clock);
      return Promise.resolve();
    },
    remove: (key) => {
      files.delete(key);
      return Promise.resolve();
    },
  };
  return {
    store,
    files,
    setClock: (time: number) => {
      clock = time;
    },
  };
};

const remote = () => Promise.resolve(REMOTE);
const offline = () => Promise.reject(new Error("offline"));

const setUpCache = () => {
  const memory = memoryStore();
  const start = 1_000_000;
  let now = start;
  memory.setClock(start);
  const cache = createRecitationCache({ store: memory.store, now: () => now });
  const at = (time: number) => {
    now = time;
    memory.setClock(time);
  };
  return { cache, memory, at, start };
};

describe(createRecitationCache, () => {
  it("streams an ayah that was never played", async () => {
    const { cache } = setUpCache();
    await expect(
      cache.source({ reciterId: 7, ayah: "2:255" }, remote)
    ).resolves.toBe(REMOTE);
  });

  it("plays a kept ayah from the device without asking for its address", async () => {
    const { cache } = setUpCache();
    await cache.keep({ reciterId: 7, ayah: "2:255" }, REMOTE);

    await expect(
      cache.source({ reciterId: 7, ayah: "2:255" }, offline)
    ).resolves.toBe("file:///7/002255.mp3");
    await expect(
      cache.source({ reciterId: 1, ayah: "2:255" }, remote)
    ).resolves.toBe(REMOTE);
  });

  it("keeps a played file for under 7 days, then streams it again", async () => {
    const { cache, at, start } = setUpCache();
    await cache.keep({ reciterId: 7, ayah: "2:255" }, REMOTE);

    at(start + 7 * DAY_MS - 1);
    await expect(
      cache.source({ reciterId: 7, ayah: "2:255" }, remote)
    ).resolves.toBe("file:///7/002255.mp3");

    at(start + 7 * DAY_MS);
    await expect(
      cache.source({ reciterId: 7, ayah: "2:255" }, remote)
    ).resolves.toBe(REMOTE);
  });

  it("does not extend a file's week when it is played again", async () => {
    const { cache, at, memory, start } = setUpCache();
    await cache.keep({ reciterId: 7, ayah: "1:1" }, REMOTE);
    at(start + 3 * DAY_MS);
    await cache.keep({ reciterId: 7, ayah: "1:1" }, REMOTE);
    expect(memory.files.get("7/001001")).toBe(start);
  });

  it("downloads an expired file again when it is kept", async () => {
    const { cache, at, memory, start } = setUpCache();
    await cache.keep({ reciterId: 7, ayah: "1:1" }, REMOTE);
    at(start + 8 * DAY_MS);
    await cache.keep({ reciterId: 7, ayah: "1:1" }, REMOTE);
    expect(memory.files.get("7/001001")).toBe(start + 8 * DAY_MS);
  });

  it("deletes files 7 days old and keeps younger ones", async () => {
    const { cache, at, memory, start } = setUpCache();
    await cache.keep({ reciterId: 7, ayah: "1:1" }, REMOTE);
    at(start + 2 * DAY_MS);
    await cache.keep({ reciterId: 7, ayah: "1:2" }, REMOTE);

    at(start + 7 * DAY_MS);
    await cache.prune();
    expect([...memory.files.keys()]).toStrictEqual(["7/001002"]);
  });
});

const play = (state: RecitationPlayback, ...events: RecitationEvent[]) => {
  let next = state;
  for (const event of events) {
    next = recitationPlayback(next, event);
  }
  return next;
};

const idle: RecitationPlayback = { status: "idle" };

describe(recitationPlayback, () => {
  it("loads the first ayah, then plays it once it is ready", () => {
    const loading = play(idle, { type: "play", ayah: "1:1", reciterId: 7 });
    expect(loading).toStrictEqual({
      status: "loading",
      ayah: "1:1",
      reciterId: 7,
      until: null,
    });
    expect(play(loading, { type: "ready" })).toMatchObject({
      status: "playing",
      ayah: "1:1",
    });
  });

  it("moves on to the next ayah, across surahs, when one finishes", () => {
    const state = play(
      idle,
      { type: "play", ayah: "1:7", reciterId: 7 },
      { type: "ready" },
      { type: "finished" }
    );
    expect(state).toMatchObject({ status: "loading", ayah: "2:1" });
  });

  it("stops after the last ayah it was asked to play", () => {
    const state = play(
      idle,
      { type: "play", ayah: "2:255", reciterId: 7, until: "2:255" },
      { type: "ready" },
      { type: "finished" }
    );
    expect(state).toStrictEqual(idle);
  });

  it("stops after the last ayah of the Quran", () => {
    const state = play(
      idle,
      { type: "play", ayah: "114:6", reciterId: 7 },
      { type: "ready" },
      { type: "finished" }
    );
    expect(state).toStrictEqual(idle);
  });

  it("pauses and resumes at the same ayah", () => {
    const paused = play(
      idle,
      { type: "play", ayah: "18:1", reciterId: 7 },
      { type: "ready" },
      { type: "pause" }
    );
    expect(paused).toMatchObject({ status: "paused", ayah: "18:1" });
    expect(play(paused, { type: "resume" })).toMatchObject({
      status: "playing",
      ayah: "18:1",
    });
  });

  it("does not pause or resume when nothing is playing", () => {
    expect(play(idle, { type: "pause" }, { type: "resume" })).toStrictEqual(
      idle
    );
  });

  it("keeps the ayah when its audio fails, so a retry loads it again", () => {
    const failed = play(
      idle,
      { type: "play", ayah: "2:1", reciterId: 7 },
      { type: "failed" }
    );
    expect(failed).toStrictEqual({
      status: "error",
      ayah: "2:1",
      reciterId: 7,
      until: null,
    });
    expect(play(failed, { type: "resume" })).toMatchObject({
      status: "loading",
      ayah: "2:1",
    });
  });

  it("ignores a late ready or finish after a stop", () => {
    expect(
      play(
        idle,
        { type: "play", ayah: "1:1", reciterId: 7 },
        { type: "stop" },
        { type: "ready" },
        { type: "finished" }
      )
    ).toStrictEqual(idle);
  });

  it("starts over at a new ayah with a new reciter", () => {
    const state = play(
      idle,
      { type: "play", ayah: "1:1", reciterId: 7 },
      { type: "ready" },
      { type: "play", ayah: "36:1", reciterId: 1 }
    );
    expect(state).toMatchObject({
      status: "loading",
      ayah: "36:1",
      reciterId: 1,
    });
  });
});

// 17 October 2026 is a Saturday.
const day = (date: number) =>
  Temporal.PlainDate.from({ year: 2026, month: 10, day: date });

describe(verseOfTheDay, () => {
  it("features a fixed ayah for each weekday", () => {
    expect(
      [17, 18, 19, 20, 21, 22, 23].map((date) => verseOfTheDay(day(date)).key)
    ).toStrictEqual([
      "20:114",
      "2:153",
      "65:3",
      "12:87",
      "2:152",
      "17:81",
      "94:5",
    ]);
  });

  it("features the same ayah again the next week", () => {
    expect(verseOfTheDay(day(30)).key).toBe("94:5");
  });
});
