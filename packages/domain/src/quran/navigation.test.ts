import { describe, expect, it } from "vitest";

import {
  DEFAULT_QURAN_READER_SETTINGS,
  firstAyahOfJuz,
  firstPageOfSurah,
  JUZ_COUNT,
  normalizeArabic,
  openReader,
  PAGE_COUNT,
  parsePage,
  readerReducer,
  scrubberDomain,
  scrubberTarget,
  scrubberValue,
  searchQuran,
  SURAH_COUNT,
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

describe("return position", () => {
  it("opens with nothing to return to", () => {
    expect(openReader({ settings: pageMode, page: 50 }).returnTo).toBeNull();
  });

  it("remembers the page before a page jump", () => {
    const state = run(openReader({ settings: pageMode, page: 50 }), {
      type: "jump",
      to: { page: 300 },
    });
    expect(state).toMatchObject({
      currentPage: 300,
      lastReadAyah: "18:54",
      returnTo: "3:1",
    });
  });

  it("remembers the Last-Read Ayah on screen before an index jump to a surah", () => {
    const state = run(openReader({ settings: pageMode, ayah: "2:255" }), {
      type: "jump",
      to: { surah: 18 },
    });
    expect(state).toMatchObject({
      currentPage: firstPageOfSurah(18),
      currentSurah: 18,
      lastReadAyah: "18:1",
      returnTo: "2:255",
    });
  });

  it("remembers the position before an index jump to a juz", () => {
    const state = run(openReader({ settings: pageMode, page: 1 }), {
      type: "jump",
      to: { ayah: firstAyahOfJuz(30).key },
    });
    expect(state).toMatchObject({
      currentPage: 582,
      lastReadAyah: "78:1",
      returnTo: "1:1",
    });
  });

  it("remembers the position before a search result opens", () => {
    const state = run(openReader({ settings: surahMode, ayah: "18:10" }), {
      type: "jump",
      to: { ayah: "2:255" },
    });
    expect(state).toMatchObject({
      currentSurah: 2,
      currentPage: 42,
      lastReadAyah: "2:255",
      returnTo: "18:10",
    });
  });

  it("remembers the surah before a Surah Mode scrubber jump", () => {
    const opened = openReader({ settings: surahMode, surah: 36 });
    const state = run(opened, {
      type: "jump",
      to: scrubberTarget("surah", 67),
    });
    expect(state).toMatchObject({ currentSurah: 67, returnTo: "36:1" });
  });

  it("remembers the page before a Page Mode scrubber jump", () => {
    const state = run(openReader({ settings: pageMode, page: 10 }), {
      type: "jump",
      to: scrubberTarget("page", 500),
    });
    expect(state).toMatchObject({ currentPage: 500, returnTo: "2:62" });
  });

  it("ignores a jump to where the Believer already is", () => {
    const paged = openReader({ settings: pageMode, ayah: "2:255" });
    expect(run(paged, { type: "jump", to: { page: 42 } })).toBe(paged);
    const flowing = openReader({ settings: surahMode, surah: 18 });
    expect(run(flowing, { type: "jump", to: { surah: 18 } })).toBe(flowing);
  });

  it("ignores a jump to nowhere", () => {
    const state = openReader({ settings: pageMode, page: 10 });
    expect(run(state, { type: "jump", to: { page: 0 } })).toBe(state);
    expect(run(state, { type: "jump", to: { surah: 115 } })).toBe(state);
    expect(run(state, { type: "jump", to: { ayah: "1:8" } })).toBe(state);
  });

  it("keeps the return position while the Believer reads on", () => {
    const state = run(
      openReader({ settings: pageMode, page: 50 }),
      { type: "jump", to: { page: 300 } },
      { type: "next-page" },
      { type: "switch-mode", mode: "surah" }
    );
    expect(state.returnTo).toBe("3:1");
  });

  it("returns to the remembered position, which can be returned from in turn", () => {
    const jumped = run(openReader({ settings: pageMode, page: 50 }), {
      type: "jump",
      to: { page: 300 },
    });
    const back = run(jumped, { type: "return" });
    expect(back).toMatchObject({
      currentPage: 50,
      lastReadAyah: "3:1",
      returnTo: "18:54",
    });
    expect(run(back, { type: "return" })).toMatchObject({
      currentPage: 300,
      returnTo: "3:1",
    });
  });

  it("does nothing on return with nowhere to return to", () => {
    const state = openReader({ settings: pageMode, page: 50 });
    expect(run(state, { type: "return" })).toBe(state);
  });
});

describe("scrubber", () => {
  it("runs over pages in Page Mode and surahs in Surah Mode", () => {
    expect(scrubberDomain("page")).toStrictEqual({ min: 1, max: PAGE_COUNT });
    expect(scrubberDomain("surah")).toStrictEqual({
      min: 1,
      max: SURAH_COUNT,
    });
  });

  it("sits at the current page or surah", () => {
    const state = openReader({ settings: pageMode, ayah: "2:255" });
    expect(scrubberValue(state)).toBe(42);
    expect(
      scrubberValue(run(state, { type: "switch-mode", mode: "surah" }))
    ).toBe(2);
  });

  it("lands on a whole page or surah within its domain", () => {
    expect(scrubberTarget("page", 41.6)).toStrictEqual({ page: 42 });
    expect(scrubberTarget("page", 9999)).toStrictEqual({ page: PAGE_COUNT });
    expect(scrubberTarget("surah", 0)).toStrictEqual({ surah: 1 });
    expect(scrubberTarget("surah", 114)).toStrictEqual({ surah: 114 });
  });
});

describe("page jump", () => {
  it("reads a typed page number in either digit set", () => {
    expect(parsePage(" 300 ")).toBe(300);
    expect(parsePage("٣٠٠")).toBe(300);
    expect(parsePage("604")).toBe(PAGE_COUNT);
  });

  it("rejects what names no page", () => {
    expect(parsePage("")).toBeNull();
    expect(parsePage("0")).toBeNull();
    expect(parsePage("605")).toBeNull();
    expect(parsePage("12a")).toBeNull();
    expect(parsePage("1.5")).toBeNull();
  });
});

describe("juz index", () => {
  it("opens each of the 30 juz at its first ayah", () => {
    expect(JUZ_COUNT).toBe(30);
    expect(firstAyahOfJuz(1).key).toBe("1:1");
    expect(firstAyahOfJuz(2)).toMatchObject({ key: "2:142", page: 22 });
    expect(firstAyahOfJuz(30)).toMatchObject({ key: "78:1", page: 582 });
    expect(() => firstAyahOfJuz(31)).toThrow(RangeError);
  });
});

describe("search", () => {
  it("strips diacritics and Quranic marks, and folds letter forms", () => {
    expect(normalizeArabic("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ")).toBe(
      "بسم الله الرحمن الرحيم"
    );
    expect(normalizeArabic("إِنَّآ أَعۡطَيۡنَٰكَ ٱلۡكَوۡثَرَ")).toBe("انا اعطينك الكوثر");
    expect(normalizeArabic("الصلاة على موسى")).toBe("الصلاه علي موسي");
  });

  it("finds an ayah typed without diacritics", () => {
    const { ayat } = searchQuran("الله لا اله الا هو الحي القيوم");
    expect(ayat.map((ayah) => ayah.key)).toStrictEqual(["2:255", "3:2"]);
  });

  it("finds an ayah typed with the alif its script writes small", () => {
    expect(searchQuran("مالك يوم الدين").ayat.map((a) => a.key)).toContain(
      "1:4"
    );
    expect(searchQuran("ذلك الكتاب").ayat.map((a) => a.key)).toContain("2:2");
  });

  it("finds an ayah typed with its diacritics", () => {
    expect(searchQuran("قُلۡ هُوَ ٱللَّهُ أَحَدٌ").ayat.map((a) => a.key)).toStrictEqual([
      "112:1",
    ]);
  });

  it("lists ayat in mushaf order", () => {
    const keys = searchQuran("الرحمن الرحيم").ayat.map((a) => a.key);
    expect(keys.slice(0, 3)).toStrictEqual(["1:1", "1:3", "2:163"]);
  });

  it("finds surahs by Arabic name, English name or number", () => {
    expect(searchQuran("البقرة").surahs.map((s) => s.number)).toStrictEqual([
      2,
    ]);
    expect(searchQuran("كهف").surahs.map((s) => s.number)).toStrictEqual([18]);
    expect(searchQuran("fatiha").surahs.map((s) => s.number)).toStrictEqual([
      1,
    ]);
    expect(searchQuran("Al-Ikhlas").surahs.map((s) => s.number)).toStrictEqual([
      112,
    ]);
    expect(searchQuran("36").surahs.map((s) => s.number)).toStrictEqual([36]);
  });

  it("opens an ayah reference directly", () => {
    expect(searchQuran("2:255").ayat.map((a) => a.key)).toStrictEqual([
      "2:255",
    ]);
    expect(searchQuran("٢:٢٥٥").ayat.map((a) => a.key)).toStrictEqual([
      "2:255",
    ]);
    expect(searchQuran("114:7").ayat).toStrictEqual([]);
  });

  it("caps the ayat it lists but counts them all", () => {
    const result = searchQuran("الله", { limit: 20 });
    expect(result.ayat).toHaveLength(20);
    expect(result.ayatTotal).toBeGreaterThan(1500);
  });

  it("finds nothing for an empty or one-letter query", () => {
    expect(searchQuran("   ")).toStrictEqual({
      surahs: [],
      ayat: [],
      ayatTotal: 0,
    });
    expect(searchQuran("ب").ayat).toStrictEqual([]);
  });
});
