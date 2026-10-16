import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  AYAT,
  BY_MEANING_DAYS,
  byMeaningRanges,
  getQuranPage,
  HIZB_QUARTER_COUNT,
  HIZB_QUARTER_STARTS,
  KFGQPC_NOTICE,
  PAGE_COUNT,
  QURAN_SOURCE,
  SAJDAH,
  SCHOLAR_REVIEWED,
  SURAH_ALIASES,
  SURAH_COUNT,
  SURAHS,
} from ".";
import type { QuranLine } from ".";

/** Ayat per surah in the Kufan count that Hafs follows (6236 in all). */
const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
/** The opening pages are centred and shorter, as in the printed mushaf. */
const OPENING_PAGES = new Set([1, 2]);

const pages = Array.from({ length: PAGE_COUNT }, (_, index) =>
  getQuranPage(index + 1)
);

interface Placed {
  page: number;
  line: number;
  item: QuranLine;
}
const placedLines: Placed[] = pages.flatMap((page) =>
  page.lines.map((item, index) => ({
    page: page.number,
    line: index + 1,
    item,
  }))
);
const placedWords = placedLines.flatMap(({ page, line, item }) =>
  item.kind === "ayah" ? item.words.map((word) => ({ page, line, word })) : []
);

describe("Quran dataset integrity", () => {
  it("has 604 pages of 15 lines, the two opening pages of 8", () => {
    expect(pages).toHaveLength(604);
    const shortPages = pages.filter((page) => page.lines.length !== 15);
    expect(shortPages.map((page) => page.number)).toStrictEqual([
      ...OPENING_PAGES,
    ]);
    expect(shortPages.map((page) => page.lines.length)).toStrictEqual([8, 8]);
    expect(() => getQuranPage(0)).toThrow(RangeError);
    expect(() => getQuranPage(605)).toThrow(RangeError);
  });

  it("places all 6236 ayat exactly once, in order, without gaps", () => {
    const expected = AYAH_COUNTS.flatMap((count, index) =>
      Array.from({ length: count }, (_, ayah) => `${index + 1}:${ayah + 1}`)
    );
    expect(expected).toHaveLength(6236);
    expect(AYAT.map((ayah) => ayah.key)).toStrictEqual(expected);

    // Consecutive runs of words, one run per ayah: no ayah split or repeated.
    const runs: string[] = [];
    for (const { word } of placedWords) {
      const key = `${word.surah}:${word.ayah}`;
      if (runs.at(-1) !== key) {
        runs.push(key);
      }
    }
    expect(runs).toStrictEqual(expected);
  });

  it("keeps every ayah within the lines KFGQPC gives for it", () => {
    const placements = Map.groupBy(
      placedWords,
      ({ word }) => `${word.surah}:${word.ayah}`
    );
    const outside = AYAT.filter((ayah) => {
      const placed = placements.get(ayah.key) ?? [];
      return (
        placed[0]?.line !== ayah.lineStart ||
        placed.at(-1)?.line !== ayah.lineEnd ||
        placed.some(
          ({ page, line }) =>
            page !== ayah.page || line < ayah.lineStart || line > ayah.lineEnd
        )
      );
    });
    expect(outside).toStrictEqual([]);
  });

  it("rebuilds the KFGQPC text verbatim from the words", () => {
    const byAyah = Map.groupBy(
      placedWords,
      ({ word }) => `${word.surah}:${word.ayah}`
    );
    const rebuilt = AYAT.map((ayah) =>
      (byAyah.get(ayah.key) ?? []).map(({ word }) => word.text).join(" ")
    );
    expect(rebuilt).toStrictEqual(AYAT.map((ayah) => ayah.text));
    const digest = createHash("sha256")
      .update(rebuilt.join("\n"))
      .digest("hex");
    expect(digest).toBe(QURAN_SOURCE.textSha256);
  });

  it("ends every ayah with a rosette carrying its number", () => {
    const ends = placedWords.filter(({ word }) => word.isAyahEnd);
    expect(ends).toHaveLength(6236);
    for (const { word } of ends) {
      const number = [...String(word.ayah)]
        .map((digit) => ARABIC_INDIC[Number(digit)])
        .join("");
      expect(word.text).toBe(`۝${number}`);
    }
  });

  it("opens each surah with its header, then a basmala except surahs 1 and 9", () => {
    const openings = placedLines.flatMap(({ item }, at) => {
      if (item.kind !== "surah-header") {
        return [];
      }
      // The lines from the header down to the first ayah line.
      const following = placedLines.slice(at + 1, at + 3);
      const opening = following.slice(
        0,
        following.findIndex((next) => next.item.kind === "ayah") + 1
      );
      const firstAyah = opening.at(-1)?.item;
      return [
        {
          surah: item.surah,
          lines: opening.map((next) => next.item.kind),
          samePage: opening.every(
            (next) => next.page === placedLines[at]?.page
          ),
          opensWithAyah1:
            firstAyah?.kind === "ayah" &&
            firstAyah.words[0]?.surah === item.surah &&
            firstAyah.words[0]?.ayah === 1,
        },
      ];
    });
    expect(openings).toStrictEqual(
      SURAHS.map(({ number }) => ({
        surah: number,
        lines: number === 1 || number === 9 ? ["ayah"] : ["basmala", "ayah"],
        samePage: true,
        opensWithAyah1: true,
      }))
    );
  });

  it("ships the KFGQPC notice with the font licence", () => {
    expect(KFGQPC_NOTICE).toContain(
      "King Fahd Glorious Quran Printing Complex"
    );
    expect(KFGQPC_NOTICE).toContain("ELECTRONIC END-USER LICENSE AGREEMENT");
  });

  it("starts 240 hizb quarters in order, one at every ۞ and the rest at surah openings", () => {
    expect(HIZB_QUARTER_STARTS).toHaveLength(HIZB_QUARTER_COUNT);
    const order = AYAT.map((ayah) => ayah.key);
    const positions = HIZB_QUARTER_STARTS.map((key) => order.indexOf(key));
    expect(
      positions.every((at, index) => at > (positions[index - 1] ?? -1))
    ).toBeTruthy();
    const starts = new Set(HIZB_QUARTER_STARTS);
    const marked = AYAT.filter((ayah) => ayah.text.startsWith("۞"));
    expect(marked.filter((ayah) => !starts.has(ayah.key))).toStrictEqual([]);
    const unmarked = AYAT.filter(
      (ayah) => starts.has(ayah.key) && !ayah.text.startsWith("۞")
    );
    expect(unmarked.filter((ayah) => ayah.ayah !== 1)).toStrictEqual([]);
  });

  it("gives every surah a unique revelation order, 1 to 114", () => {
    const orders = SURAHS.map((surah) => surah.revelationOrder);
    expect(orders.toSorted((a, b) => a - b)).toStrictEqual(
      Array.from({ length: SURAH_COUNT }, (_, index) => index + 1)
    );
    // Al-Alaq was revealed first, An-Nasr last.
    expect(SURAHS[95]?.revelationOrder).toBe(1);
    expect(SURAHS[109]?.revelationOrder).toBe(114);
  });

  it("labels the places of revelation", () => {
    expect(SURAHS[0]?.revelationPlace).toBe("meccan");
    expect(SURAHS[1]?.revelationPlace).toBe("medinan");
    expect(SURAHS[113]?.revelationPlace).toBe("meccan");
  });
});

describe("Surah aliases", () => {
  const entries = Object.entries(SURAH_ALIASES).flatMap(([number, aliases]) =>
    aliases.map((alias) => ({ number: Number(number), alias }))
  );

  it("name only real Surahs", () => {
    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.filter(({ number }) => SURAHS[number - 1] === undefined)
    ).toStrictEqual([]);
  });

  it("has no blank, padded or repeated alias", () => {
    const spellings = entries.map(({ alias }) => alias.toLowerCase());
    expect(
      entries.filter(({ alias }) => alias.trim() !== alias || !alias)
    ).toStrictEqual([]);
    expect(new Set(spellings).size).toBe(spellings.length);
  });
});

const indexOfAyah = (key: string) => AYAT.findIndex((ayah) => ayah.key === key);

describe("Khatmah by-meaning divisions", () => {
  const surahEnds = new Set(
    SURAHS.map(
      (surah) => `${surah.number}:${AYAH_COUNTS[surah.number - 1] ?? 0}`
    )
  );
  const quarterEnds = new Set<string>(
    HIZB_QUARTER_STARTS.slice(1).map(
      (key) => AYAT[indexOfAyah(key) - 1]?.key ?? ""
    )
  );

  describe.each(BY_MEANING_DAYS)("%i days", (days) => {
    const ranges = byMeaningRanges(days);

    it("has one range per day", () => {
      expect(ranges).toHaveLength(days);
    });

    it("is contiguous and covers all 6236 ayat exactly once", () => {
      const gaps = ranges.flatMap((range, position) => {
        const previous = ranges[position - 1];
        const expectedFrom = previous ? indexOfAyah(previous.to) + 1 : 0;
        return indexOfAyah(range.from) === expectedFrom &&
          indexOfAyah(range.to) >= expectedFrom
          ? []
          : [range];
      });
      expect(gaps).toStrictEqual([]);
      expect(ranges[0]?.from).toBe("1:1");
      expect(ranges.at(-1)?.to).toBe("114:6");
    });

    it("ends every range at a surah end or a hizb quarter end", () => {
      const strays = ranges.filter(
        ({ to }) => !(surahEnds.has(to) || quarterEnds.has(to))
      );
      expect(strays).toStrictEqual([]);
    });
  });

  it("is the seven classical manzil for 7 days, ending at surah ends", () => {
    expect(byMeaningRanges(7).map((range) => range.to)).toStrictEqual([
      "4:176",
      "9:129",
      "16:128",
      "25:77",
      "36:83",
      "49:18",
      "114:6",
    ]);
  });

  it("marks the unreviewed divisions", () => {
    expect(SCHOLAR_REVIEWED).toStrictEqual({ 7: true, 29: false, 60: false });
  });
});

describe("sajdah ayat", () => {
  it("points every entry at a real ayah, once", () => {
    const keys = new Set(AYAT.map((ayah) => ayah.key));
    expect(SAJDAH).toHaveLength(15);
    for (const { ayah } of SAJDAH) {
      expect(keys.has(ayah)).toBeTruthy();
    }
    expect(new Set(SAJDAH.map(({ ayah }) => ayah)).size).toBe(SAJDAH.length);
  });

  it("makes the four 'azaa'im obligatory and the rest recommended", () => {
    const obligatory = SAJDAH.filter(({ kind }) => kind === "obligatory");
    expect(obligatory.map(({ ayah }) => ayah)).toStrictEqual([
      "32:15",
      "41:37",
      "53:62",
      "96:19",
    ]);
    expect(SAJDAH.length - obligatory.length).toBe(11);
  });

  it("anchors each sajdah on its ayah's sign of prostration or its wording", () => {
    // KFGQPC prints ۩ on 15 ayat; 41:38 is the Madinah placement of 41:37's.
    const signed = AYAT.filter((ayah) => ayah.text.includes("۩")).map(
      (ayah) => ayah.key
    );
    expect(signed).toHaveLength(15);
    const ours = new Set(SAJDAH.map(({ ayah }) => ayah as string));
    expect(signed.filter((key) => !ours.has(key))).toStrictEqual(["41:38"]);
  });
});
