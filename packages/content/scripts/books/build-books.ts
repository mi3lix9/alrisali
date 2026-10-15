/**
 * Builds the bundled Books (Mafatih al-Jinan, Sahifa Sajjadiyya, Nahj
 * al-Balagha) from Thaqalayn (CC BY 4.0) into `src/books/data/`.
 *
 *   bun run books:build [--cache <dir>]
 *
 * Raw downloads are kept in the cache directory (default: the OS temp dir) so
 * a rebuild does not hit Thaqalayn again. Supplication ids are a contract:
 * Daily Content and the Believer's Favorites and Reading Completions refer to
 * them. Ids come from the tables below, never from the source's numbering, and
 * the build fails if a previously published id would disappear.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

interface Localized {
  ar: string;
  en: string;
}

interface Passage {
  ar: string;
  en?: string;
}

interface SupplicationOut {
  id: string;
  number?: number;
  title: Localized;
}

interface SectionOut {
  id: string;
  title: Localized;
  supplications: SupplicationOut[];
}

interface BookOut {
  id: string;
  title: Localized;
  source: "thaqalayn";
  sourceUrl: string;
  sections: SectionOut[];
}

const DATA_DIR = path.join(import.meta.dirname, "../../src/books/data");
const TEXTS_DIR = path.join(DATA_DIR, "texts");
const PUBLISHED_IDS = path.join(DATA_DIR, "published-ids.json");

const DUAS_URL = "https://thaqalayn.com/duas";
const NAHJ_BOOK_URL = "https://thaqalayn.com/book/32";
const NAHJ_API_URL =
  "https://www.thaqalayn-api.net/api/v2/Nahj-al-Balagha-Radi";
// The same project's published dataset, used when the API is unavailable.
const NAHJ_DATASET_URL =
  "https://raw.githubusercontent.com/MohammedArab1/ThaqalaynAPI/main/V2/ThaqalaynData/32.json";

const REQUEST_GAP_MS = 300;

/** Mafatih al-Jinan duas and ziyarat that Thaqalayn carries, by its path. */
const MAFATIH: { sectionId: "duas" | "ziyarat"; path: string; id: string }[] = [
  { sectionId: "duas", path: "dua-kumayl", id: "mafatih-dua-kumayl" },
  { sectionId: "duas", path: "dua-sabah", id: "mafatih-dua-sabah" },
  { sectionId: "duas", path: "dua-al-iftitah", id: "mafatih-dua-iftitah" },
  { sectionId: "duas", path: "dua-nudba", id: "mafatih-dua-nudba" },
  { sectionId: "duas", path: "dua-mashlool", id: "mafatih-dua-mashlool" },
  { sectionId: "duas", path: "dua-al-asharat", id: "mafatih-dua-asharat" },
  {
    sectionId: "ziyarat",
    path: "ziyarat-ashura",
    id: "mafatih-ziyarat-ashura",
  },
  {
    sectionId: "ziyarat",
    path: "ziyarat-warith",
    id: "mafatih-ziyarat-warith",
  },
  {
    sectionId: "ziyarat",
    path: "ziyarat-arbaeen",
    id: "mafatih-ziyarat-arbaeen",
  },
  {
    sectionId: "ziyarat",
    path: "ziyrat-aale-yasin",
    id: "mafatih-ziyarat-aal-yasin",
  },
  {
    sectionId: "ziyarat",
    path: "ziyarat-jamia-kabira",
    id: "mafatih-ziyarat-jamia-kabira",
  },
];

const SAHIFA_PREFIX = "sahifa-sajjadiya-";
const SAHIFA_COUNT = 54;
const WEEKDAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

const NAHJ_SECTIONS = [
  {
    categoryId: "1",
    id: "sermons",
    idPrefix: "nahj-sermon-",
    title: { ar: "الخطب", en: "Sermons" },
    item: { ar: "الخطبة", en: "Sermon" },
  },
  {
    categoryId: "2",
    id: "letters",
    idPrefix: "nahj-letter-",
    title: { ar: "الرسائل", en: "Letters" },
    item: { ar: "الرسالة", en: "Letter" },
  },
  {
    categoryId: "3",
    id: "sayings",
    idPrefix: "nahj-saying-",
    title: { ar: "الحِكَم", en: "Sayings" },
    item: { ar: "الحكمة", en: "Saying" },
  },
] as const;

// Thaqalayn's Nahj al-Balagha follows Subhi al-Salih's numbering.
const NAHJ_EXPECTED_COUNTS: Record<string, number> = {
  "1": 241,
  "2": 79,
  "3": 480,
};

const { values: args } = parseArgs({
  options: { cache: { type: "string" } },
});
const cacheDir = args.cache ?? path.join(tmpdir(), "alrisali-books-cache");
mkdirSync(cacheDir, { recursive: true });

const fetchCached = async (url: string, cacheName: string): Promise<string> => {
  const file = path.join(cacheDir, cacheName);
  if (existsSync(file)) {
    return readFileSync(file, "utf-8");
  }
  await Bun.sleep(REQUEST_GAP_MS);
  const response = await fetch(url, {
    headers: { "user-agent": "alrisali-books-build" },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`);
  }
  const body = await response.text();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, body);
  return body;
};

// --- Thaqalayn dua pages (Next.js flight data) --------------------------------

const FLIGHT_CHUNK = /self\.__next_f\.push\((?<chunk>\[.*?\])\)<\/script>/gsu;

/** The React Server Components payload embedded in a Next.js page. */
const flightPayload = (html: string): string => {
  let payload = "";
  for (const match of html.matchAll(FLIGHT_CHUNK)) {
    const chunk: unknown = JSON.parse(match.groups?.chunk ?? "[]");
    if (Array.isArray(chunk) && typeof chunk[1] === "string") {
      payload += chunk[1];
    }
  }
  return payload;
};

/** Parses the JSON value starting at `start` (a `{` or `[`). */
const jsonValueAt = (text: string, start: number): unknown => {
  let depth = 0;
  let inString = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (char === "\\") {
        index += 1;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(text.slice(start, index + 1));
      }
    }
  }
  throw new Error("Unterminated JSON value in flight payload");
};

interface DuaSummary {
  id: number;
  path: string;
  name_en: string;
  name_ar: string;
}

interface DuaVerse {
  number: number;
  text_ar: string | null;
  text_en: string | null;
}

interface Dua extends DuaSummary {
  DuaVerse: DuaVerse[];
}

const fetchDua = async (duaPath: string): Promise<Dua> => {
  const html = await fetchCached(
    `${DUAS_URL}/${duaPath}`,
    `duas/${duaPath}.html`
  );
  const payload = flightPayload(html);
  const marker = '"initialData":';
  const start = payload.indexOf(marker);
  if (start === -1) {
    throw new Error(`No dua data on ${DUAS_URL}/${duaPath}`);
  }
  const initial = jsonValueAt(payload, start + marker.length) as {
    data: { dua: Dua };
  };
  return initial.data.dua;
};

const fetchDuaIndex = async (): Promise<DuaSummary[]> => {
  const html = await fetchCached(
    `${DUAS_URL}/dua-kumayl`,
    "duas/dua-kumayl.html"
  );
  const payload = flightPayload(html);
  const marker = '"allDuas":';
  const start = payload.indexOf(marker);
  if (start === -1) {
    throw new Error("No dua index in the Thaqalayn dua page");
  }
  return jsonValueAt(payload, start + marker.length) as DuaSummary[];
};

const clean = (text: string | null | undefined): string =>
  (text ?? "").replaceAll(/\s+/gu, " ").trim();

const duaPassages = (dua: Dua): Passage[] =>
  dua.DuaVerse.toSorted((a, b) => a.number - b.number)
    .map((verse): Passage => {
      const en = clean(verse.text_en);
      return en
        ? { ar: clean(verse.text_ar), en }
        : { ar: clean(verse.text_ar) };
    })
    .filter((passage) => passage.ar || passage.en);

// --- Nahj al-Balagha (ThaqalaynAPI) -------------------------------------------

interface NahjHadith {
  categoryId: string | number;
  chapterInCategoryId: string | number;
  chapter: string;
  URL: string;
  arabicText: string;
  englishText: string;
}

const fetchNahj = async (): Promise<NahjHadith[]> => {
  try {
    return JSON.parse(await fetchCached(NAHJ_API_URL, "nahj-api.json"));
  } catch (error) {
    console.warn(
      `ThaqalaynAPI unavailable (${String(error)}); using its dataset`
    );
    return JSON.parse(await fetchCached(NAHJ_DATASET_URL, "32.json"));
  }
};

const FOOTNOTE_MARK = /\s*\[\d+\]/gu;
const LEADING_NUMBER = /^[\d٠-٩]+\.\s*/u;

const nahjPassage = (hadith: NahjHadith, first: boolean): Passage => {
  const strip = (text: string) => {
    const cleaned = clean(text.replaceAll(FOOTNOTE_MARK, ""));
    return first ? cleaned.replace(LEADING_NUMBER, "") : cleaned;
  };
  const en = strip(hadith.englishText);
  return en
    ? { ar: strip(hadith.arabicText), en }
    : { ar: strip(hadith.arabicText) };
};

// --- Build --------------------------------------------------------------------

const texts = new Map<string, Passage[]>();

const buildMafatih = async (): Promise<BookOut> => {
  const sections: SectionOut[] = [
    {
      id: "duas",
      title: { ar: "الأدعية", en: "Supplications" },
      supplications: [],
    },
    {
      id: "ziyarat",
      title: { ar: "الزيارات", en: "Ziyarat" },
      supplications: [],
    },
  ];
  for (const entry of MAFATIH) {
    // oxlint-disable-next-line no-await-in-loop -- one request at a time
    const dua = await fetchDua(entry.path);
    texts.set(entry.id, duaPassages(dua));
    sections
      .find((section) => section.id === entry.sectionId)
      ?.supplications.push({
        id: entry.id,
        title: { ar: clean(dua.name_ar), en: clean(dua.name_en) },
      });
  }
  return {
    id: "mafatih",
    title: { ar: "مفاتيح الجنان", en: "Mafatih al-Jinan" },
    source: "thaqalayn",
    sourceUrl: DUAS_URL,
    sections,
  };
};

const buildSahifa = async (index: DuaSummary[]): Promise<BookOut> => {
  const sahifa = index.filter((dua) => dua.path.startsWith(SAHIFA_PREFIX));
  const numbered: SupplicationOut[] = [];
  for (let number = 1; number <= SAHIFA_COUNT; number += 1) {
    // Thaqalayn's ids 1–54 are the Sahifa's own numbering.
    const summary = sahifa.find((dua) => dua.id === number);
    if (!summary) {
      throw new Error(`Sahifa supplication ${number} is missing on Thaqalayn`);
    }
    const id = `sahifa-${number}`;
    // oxlint-disable-next-line no-await-in-loop -- one request at a time
    const dua = await fetchDua(summary.path);
    texts.set(id, duaPassages(dua));
    numbered.push({
      id,
      number,
      title: { ar: clean(dua.name_ar), en: clean(dua.name_en) },
    });
  }
  const weekdays: SupplicationOut[] = [];
  for (const weekday of WEEKDAYS) {
    const id = `sahifa-weekday-${weekday}`;
    // oxlint-disable-next-line no-await-in-loop -- one request at a time
    const dua = await fetchDua(
      `${SAHIFA_PREFIX}the-supplication-for-${weekday}`
    );
    texts.set(id, duaPassages(dua));
    weekdays.push({
      id,
      title: { ar: clean(dua.name_ar), en: clean(dua.name_en) },
    });
  }
  return {
    id: "sahifa",
    title: { ar: "الصحيفة السجادية", en: "al-Sahifa al-Sajjadiyya" },
    source: "thaqalayn",
    sourceUrl: DUAS_URL,
    sections: [
      {
        id: "supplications",
        title: { ar: "أدعية الصحيفة", en: "Supplications" },
        supplications: numbered,
      },
      {
        id: "weekdays",
        title: {
          ar: "أدعية أيام الأسبوع",
          en: "Supplications for the days of the week",
        },
        supplications: weekdays,
      },
    ],
  };
};

const buildNahj = async (): Promise<BookOut> => {
  const hadiths = await fetchNahj();
  const sections = NAHJ_SECTIONS.map((section): SectionOut => {
    const chapters = new Map<number, NahjHadith[]>();
    for (const hadith of hadiths) {
      if (String(hadith.categoryId) === section.categoryId) {
        const number = Number(hadith.chapterInCategoryId);
        chapters.set(number, [...(chapters.get(number) ?? []), hadith]);
      }
    }
    const expected = NAHJ_EXPECTED_COUNTS[section.categoryId];
    if (chapters.size !== expected) {
      throw new Error(
        `Nahj ${section.id}: ${chapters.size} chapters, expected ${expected}`
      );
    }
    const supplications = [...chapters.entries()]
      .toSorted(([a], [b]) => a - b)
      .map(([number, paragraphs]): SupplicationOut => {
        // The last URL segment is the paragraph's place in its chapter.
        const ordered = paragraphs.toSorted(
          (a, b) =>
            Number(a.URL.split("/").at(-1)) - Number(b.URL.split("/").at(-1))
        );
        const id = `${section.idPrefix}${number}`;
        texts.set(
          id,
          ordered.map((hadith, index) => nahjPassage(hadith, index === 0))
        );
        // The number is part of the title (الخطبة ٣, Sermon 3: …), so a
        // Nahj item carries no separate number.
        return {
          id,
          title: {
            ar: `${section.item.ar} ${number.toLocaleString("ar-u-nu-arab", { useGrouping: false })}`,
            en: `${section.item.en} ${number}: ${clean(ordered[0]?.chapter)}`,
          },
        };
      });
    return { id: section.id, title: section.title, supplications };
  });
  return {
    id: "nahj",
    title: { ar: "نهج البلاغة", en: "Nahj al-Balagha" },
    source: "thaqalayn",
    sourceUrl: NAHJ_BOOK_URL,
    sections,
  };
};

const index = await fetchDuaIndex();
const books = [
  await buildMafatih(),
  await buildSahifa(index),
  await buildNahj(),
];

const ids = books.flatMap((book) =>
  book.sections.flatMap((section) => section.supplications.map(({ id }) => id))
);
if (new Set(ids).size !== ids.length) {
  throw new Error("Duplicate Supplication ids");
}
for (const id of ids) {
  if (!texts.get(id)?.some((passage) => passage.ar)) {
    throw new Error(`Supplication ${id} has no Arabic text`);
  }
}

const published: string[] = existsSync(PUBLISHED_IDS)
  ? JSON.parse(readFileSync(PUBLISHED_IDS, "utf-8"))
  : [];
const dropped = published.filter((id) => !ids.includes(id));
if (dropped.length > 0) {
  throw new Error(
    `Published Supplication ids would disappear: ${dropped.join(", ")}`
  );
}

rmSync(TEXTS_DIR, { force: true, recursive: true });
mkdirSync(TEXTS_DIR, { recursive: true });
for (const id of ids) {
  writeFileSync(
    path.join(TEXTS_DIR, `${id}.json`),
    `${JSON.stringify(texts.get(id))}\n`
  );
}
writeFileSync(
  path.join(DATA_DIR, "catalog.json"),
  `${JSON.stringify({ books }, null, 2)}\n`
);
writeFileSync(
  PUBLISHED_IDS,
  `${JSON.stringify([...published, ...ids.filter((id) => !published.includes(id))], null, 2)}\n`
);
writeFileSync(
  path.join(DATA_DIR, "texts.ts"),
  [
    "// Generated by scripts/books/build-books.ts. Do not edit.",
    'import type { Passage } from "../types";',
    "",
    "/** Loads one Supplication's text on demand, so a Book is never read whole. */",
    "export const TEXT_LOADERS: Record<",
    "  string,",
    "  () => Promise<{ default: readonly Passage[] }>",
    "> = {",
    ...ids.map((id) => `  "${id}": () => import("./texts/${id}.json"),`),
    "};",
    "",
  ].join("\n")
);

console.log(`Wrote ${books.length} Books, ${ids.length} Supplications`);
