import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  BOOKS,
  getBook,
  getSupplication,
  loadSupplicationText,
  SUPPLICATION_IDS,
} from ".";
import { CONTENT_SOURCES } from "../sources";
import publishedIds from "./data/published-ids.json";

const NOTICES_DIR = path.join(import.meta.dirname, "../../notices");
const STABLE_ID = /^[a-z]+(?:-[a-z0-9]+)+$/u;
// Loading every Supplication text takes seconds on a busy machine.
const LOAD_ALL_TEXTS_TIMEOUT = 30_000;

describe("Books content integrity", () => {
  it("bundles Mafatih al-Jinan, Sahifa Sajjadiyya and Nahj al-Balagha", () => {
    expect(BOOKS.map((book) => book.id)).toStrictEqual([
      "mafatih",
      "sahifa",
      "nahj",
    ]);
  });

  it("gives every Supplication a unique, well-formed id", () => {
    expect(new Set(SUPPLICATION_IDS).size).toBe(SUPPLICATION_IDS.length);
    for (const id of SUPPLICATION_IDS) {
      expect(id).toMatch(STABLE_ID);
    }
  });

  it(
    "keeps every published Supplication id",
    async () => {
      expect(publishedIds.length).toBeGreaterThan(0);
      for (const id of publishedIds) {
        expect(getSupplication(id)?.id).toBe(id);
      }
      const texts = await Promise.all(publishedIds.map(loadSupplicationText));
      for (const text of texts) {
        expect(text).not.toHaveLength(0);
      }
    },
    LOAD_ALL_TEXTS_TIMEOUT
  );

  it(
    "has Arabic text for every Supplication",
    async () => {
      const texts = await Promise.all(
        SUPPLICATION_IDS.map(loadSupplicationText)
      );
      const withoutArabic = SUPPLICATION_IDS.filter(
        (_, index) => !texts[index]?.some((passage) => passage.ar.length > 0)
      );
      expect(withoutArabic).toStrictEqual([]);
    },
    LOAD_ALL_TEXTS_TIMEOUT
  );

  it(
    "writes Arabic letters, not the Persian ی and ک",
    async () => {
      const persian = /[\u06CC\u06A9]/u;
      const titles = SUPPLICATION_IDS.filter((id) =>
        persian.test(getSupplication(id)?.title.ar ?? "")
      );
      const texts = await Promise.all(
        SUPPLICATION_IDS.map(loadSupplicationText)
      );
      const bodies = SUPPLICATION_IDS.filter((_, index) =>
        texts[index]?.some((passage) => persian.test(passage.ar))
      );
      expect([...titles, ...bodies]).toStrictEqual([]);
    },
    LOAD_ALL_TEXTS_TIMEOUT
  );

  it("holds the Sahifa's 54 supplications and its seven weekday supplications", () => {
    const sahifa = getBook("sahifa");
    expect(
      sahifa?.sections.map((section) => section.supplications.length)
    ).toStrictEqual([54, 7]);
    expect(getSupplication("sahifa-weekday-friday")).toMatchObject({
      bookId: "sahifa",
      title: { ar: "دعاء يوم الجمعة" },
    });
    expect(getSupplication("sahifa-1")?.number).toBe(1);
  });

  it("numbers Nahj al-Balagha as Subhi al-Salih: 241 sermons, 79 letters, 480 sayings", () => {
    expect(
      getBook("nahj")?.sections.map((section) => section.supplications.length)
    ).toStrictEqual([241, 79, 480]);
    expect(getSupplication("nahj-sermon-3")?.title.en).toMatch(
      /^Sermon 3: Shaqshaqiya/u
    );
  });

  it("holds the Mafatih duas and ziyarat by their stable ids", () => {
    expect(getSupplication("mafatih-dua-kumayl")?.bookId).toBe("mafatih");
    expect(getSupplication("mafatih-ziyarat-ashura")?.sectionId).toBe(
      "ziyarat"
    );
  });

  it("credits and ships a CC BY 4.0 notice for each Book's source", () => {
    const sources = [...new Set(BOOKS.map((book) => book.source))];
    const credited = new Set<string>(CONTENT_SOURCES.map(({ id }) => id));
    expect(sources.filter((source) => !credited.has(source))).toStrictEqual([]);
    const notices = sources.map((source) =>
      path.join(NOTICES_DIR, `${source}.md`)
    );
    expect(notices.filter((notice) => !existsSync(notice))).toStrictEqual([]);
    for (const notice of notices) {
      expect(readFileSync(notice, "utf-8")).toContain("CC BY 4.0");
    }
  });

  it("rejects an unknown Supplication id", async () => {
    expect(getSupplication("no-such-id")).toBeUndefined();
    await expect(loadSupplicationText("no-such-id")).rejects.toThrow(
      /no-such-id/u
    );
  });
});

describe("Supplication reader fonts", () => {
  const FONTS = [
    { source: "amiri", file: "amiri-regular.ttf" },
    {
      source: "ibm-plex-sans-arabic",
      file: "ibm-plex-sans-arabic-regular.ttf",
    },
  ];

  it("credits each bundled face and ships its Open Font License", () => {
    const credited = new Set<string>(CONTENT_SOURCES.map(({ id }) => id));
    for (const { source, file } of FONTS) {
      expect(credited.has(source)).toBeTruthy();
      expect(
        existsSync(path.join(import.meta.dirname, "fonts", file))
      ).toBeTruthy();
      const notice = readFileSync(
        path.join(NOTICES_DIR, `${source}.md`),
        "utf-8"
      );
      expect(notice).toContain("SIL OPEN FONT LICENSE Version 1.1");
      expect(notice).toContain(file);
    }
  });
});
