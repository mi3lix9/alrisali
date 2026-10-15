import { describe, expect, it } from "vitest";

import {
  ayatOnPage,
  DEFAULT_QURAN_READER_SETTINGS,
  findAyah,
  firstPageOfSurah,
  openReader,
  PAGE_COUNT,
  pagePosition,
  readerReducer,
  SURAH_COUNT,
  surahEnd,
} from ".";
import type { QuranReaderState, ReaderAction } from ".";

const pageMode = DEFAULT_QURAN_READER_SETTINGS;
const surahMode = { ...DEFAULT_QURAN_READER_SETTINGS, mode: "surah" as const };

const run = (state: QuranReaderState, ...actions: ReaderAction[]) => {
  let next = state;
  for (const action of actions) {
    next = readerReducer(next, action);
  }
  return next;
};

describe("mushaf lookups", () => {
  it("finds the page of an ayah at the mushaf's edges", () => {
    expect(findAyah("1:1")?.page).toBe(1);
    expect(findAyah("2:1")?.page).toBe(2);
    expect(findAyah("114:6")?.page).toBe(PAGE_COUNT);
    expect(findAyah("114:7")).toBeUndefined();
  });

  it("lists the ayat on a page, in order", () => {
    expect(ayatOnPage(1).map((ayah) => ayah.key)).toStrictEqual([
      "1:1",
      "1:2",
      "1:3",
      "1:4",
      "1:5",
      "1:6",
      "1:7",
    ]);
    const last = ayatOnPage(PAGE_COUNT).map((ayah) => ayah.key);
    expect(last[0]).toBe("112:1");
    expect(last.at(-1)).toBe("114:6");
    expect(() => ayatOnPage(PAGE_COUNT + 1)).toThrow(RangeError);
  });

  it("places every ayah on exactly one page", () => {
    const pages = Array.from({ length: PAGE_COUNT }, (_, index) =>
      ayatOnPage(index + 1)
    );
    expect(pages.flat()).toHaveLength(6236);
    expect(pages.every((ayat) => ayat.length > 0)).toBeTruthy();
  });

  it("gives each page its juz and hizb quarter", () => {
    expect(pagePosition(1)).toStrictEqual({
      page: 1,
      surah: 1,
      juz: 1,
      hizb: 1,
      quarter: 0,
    });
    // Juz 2 (hizb 3) opens page 22 with 2:142.
    expect(pagePosition(21)).toMatchObject({ juz: 1, hizb: 2, quarter: 3 });
    expect(pagePosition(22)).toMatchObject({ juz: 2, hizb: 3, quarter: 0 });
    // The quarter KFGQPC marks at 15:49 (page 264) holds from page 265.
    expect(pagePosition(265)).toMatchObject({ hizb: 27, quarter: 1 });
    expect(pagePosition(PAGE_COUNT)).toMatchObject({
      surah: 112,
      juz: 30,
      hizb: 60,
      quarter: 3,
    });
  });
});

describe("reader navigation", () => {
  it("opens at an ayah's page, or at the start for an unknown target", () => {
    expect(openReader({ settings: pageMode, ayah: "2:255" })).toStrictEqual({
      mode: "page",
      pageNav: "horizontal",
      currentPage: 42,
      currentSurah: 2,
      lastReadAyah: "2:255",
      returnTo: null,
    });
    expect(openReader({ settings: pageMode, page: 605 })).toMatchObject({
      currentPage: 1,
      currentSurah: 1,
    });
    expect(openReader({ settings: surahMode, surah: 18 })).toMatchObject({
      currentPage: firstPageOfSurah(18),
      currentSurah: 18,
    });
  });

  it("keeps pages within 1–604", () => {
    const first = openReader({ settings: pageMode, page: 1 });
    expect(run(first, { type: "previous-page" })).toBe(first);
    expect(run(first, { type: "next-page" }).currentPage).toBe(2);
    const last = openReader({ settings: pageMode, page: PAGE_COUNT });
    expect(run(last, { type: "next-page" })).toBe(last);
    expect(run(last, { type: "previous-page" }).currentPage).toBe(603);
  });

  it("ignores a page outside 1–604", () => {
    const first = openReader({ settings: pageMode, page: 1 });
    expect(run(first, { type: "page-shown", page: 0 })).toBe(first);
    expect(run(first, { type: "page-shown", page: 605 })).toBe(first);
  });

  it("keeps surahs within 1–114, opening each at its first page", () => {
    const first = openReader({ settings: surahMode, surah: 1 });
    expect(run(first, { type: "previous-surah" })).toBe(first);
    expect(run(first, { type: "next-surah" })).toMatchObject({
      currentSurah: 2,
      currentPage: 2,
      lastReadAyah: "2:1",
    });
    const last = openReader({ settings: surahMode, surah: SURAH_COUNT });
    expect(run(last, { type: "next-surah" })).toBe(last);
    expect(run(last, { type: "previous-surah" }).currentSurah).toBe(113);
  });

  it("offers the next surah at a surah's end, and none after the last", () => {
    expect(surahEnd(1)).toStrictEqual({ nextSurah: 2 });
    expect(surahEnd(SURAH_COUNT)).toStrictEqual({ nextSurah: null });
  });

  it("follows paging with the page's first ayah", () => {
    const state = run(
      openReader({ settings: pageMode, page: 2 }),
      { type: "page-shown", page: 3 },
      { type: "next-page" }
    );
    expect(state).toMatchObject({ currentPage: 4, lastReadAyah: "2:17" });
  });

  it("keeps a mid-page position when its own page is shown again", () => {
    const state = openReader({ settings: pageMode, ayah: "2:10" });
    expect(run(state, { type: "page-shown", page: 3 })).toBe(state);
  });

  it("follows Surah Mode scrolling with the ayah on top", () => {
    const state = run(openReader({ settings: surahMode, surah: 2 }), {
      type: "ayah-shown",
      ayah: "2:255",
    });
    expect(state).toMatchObject({
      currentSurah: 2,
      currentPage: 42,
      lastReadAyah: "2:255",
    });
  });

  it("keeps the same ayah across a switch to Surah Mode and back", () => {
    const paged = openReader({ settings: pageMode, ayah: "2:255" });
    const flowing = run(paged, { type: "switch-mode", mode: "surah" });
    expect(flowing).toMatchObject({
      mode: "surah",
      currentSurah: 2,
      lastReadAyah: "2:255",
    });
    const scrolled = run(flowing, { type: "ayah-shown", ayah: "2:260" });
    expect(run(scrolled, { type: "switch-mode", mode: "page" })).toMatchObject({
      mode: "page",
      currentPage: 44,
      lastReadAyah: "2:260",
    });
  });

  it("switches to the start of the surah on screen when the Last-Read Ayah is elsewhere", () => {
    const state: QuranReaderState = {
      ...openReader({ settings: surahMode, surah: 18 }),
      lastReadAyah: "2:255",
    };
    expect(run(state, { type: "switch-mode", mode: "page" })).toMatchObject({
      currentPage: firstPageOfSurah(18),
      lastReadAyah: "18:1",
    });
  });

  it("changes how pages turn without moving", () => {
    const state = openReader({ settings: pageMode, page: 100 });
    expect(
      run(state, { type: "set-page-nav", pageNav: "vertical" })
    ).toStrictEqual({ ...state, pageNav: "vertical" });
  });
});

describe("Last-Read Ayah", () => {
  it("reopens at the saved Last-Read Ayah when no target is given, in either mode", () => {
    expect(
      openReader({ settings: pageMode, lastReadAyah: "18:10" })
    ).toStrictEqual({
      mode: "page",
      pageNav: "horizontal",
      currentPage: findAyah("18:10")?.page,
      currentSurah: 18,
      lastReadAyah: "18:10",
      returnTo: null,
    });
    expect(
      openReader({ settings: surahMode, lastReadAyah: "18:10" })
    ).toMatchObject({ mode: "surah", currentSurah: 18, lastReadAyah: "18:10" });
  });

  it("opens at the start with no Last-Read Ayah, and an explicit target wins over it", () => {
    expect(openReader({ settings: pageMode })).toMatchObject({
      currentPage: 1,
      lastReadAyah: null,
    });
    expect(
      openReader({ settings: pageMode, page: 100, lastReadAyah: "18:10" })
    ).toMatchObject({ currentPage: 100, lastReadAyah: "18:10" });
  });

  it("sets the Last-Read Ayah explicitly without moving the reader", () => {
    const state = openReader({ settings: pageMode, page: 42 });
    expect(run(state, { type: "set-last-read", ayah: "2:257" })).toStrictEqual({
      ...state,
      lastReadAyah: "2:257",
    });
    expect(run(state, { type: "set-last-read", ayah: "2:999" })).toBe(state);
  });

  it("lets paging override an explicit set", () => {
    const state = run(
      openReader({ settings: pageMode, page: 42 }),
      { type: "set-last-read", ayah: "2:257" },
      { type: "next-page" }
    );
    expect(state.lastReadAyah).toBe(ayatOnPage(43)[0]?.key);
  });

  it("keeps an explicitly set ayah across a mode switch in both directions", () => {
    const set = run(openReader({ settings: pageMode, page: 42 }), {
      type: "set-last-read",
      ayah: "2:255",
    });
    const flowing = run(set, { type: "switch-mode", mode: "surah" });
    expect(flowing).toMatchObject({
      mode: "surah",
      currentSurah: 2,
      lastReadAyah: "2:255",
    });
    expect(run(flowing, { type: "switch-mode", mode: "page" })).toMatchObject({
      mode: "page",
      currentPage: 42,
      lastReadAyah: "2:255",
    });
  });
});
