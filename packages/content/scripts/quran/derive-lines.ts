// Works out every Quran Page's lines from KFGQPC's per-ayah line spans and the
// PDF's text layer. KFGQPC gives the first and last line of each ayah; where
// an ayah that spans lines breaks is chosen so each line's letters best match
// the PDF row printed there, and the choice must beat every one-word shift.
import { isCountedChar } from "./pdf-rows";
import type { KfgqpcAyah } from "./source";

export type DerivedLine =
  | { kind: "surah-header"; surah: number }
  | { kind: "basmala"; surah: number }
  /** Global word indices (all ayat split on spaces, in order), inclusive. */
  | { kind: "ayah"; first: number; last: number };

/** Surahs whose first ayah is the basmala (1) or that have none (9). */
const NO_SEPARATE_BASMALA = new Set([1, 9]);

const fail = (page: number, message: string): never => {
  throw new Error(`Page ${page}: ${message}`);
};

const countChars = (text: string, alphabet: Map<string, number>): number[] => {
  const counts = Array.from({ length: alphabet.size }, () => 0);
  for (const char of text) {
    const slot = alphabet.get(char);
    if (slot !== undefined) {
      counts[slot] = (counts[slot] ?? 0) + 1;
    }
  }
  return counts;
};

interface PageInput {
  page: number;
  ayat: KfgqpcAyah[];
  /** Global index of the first word of each ayah in `ayat`. */
  firstWords: number[];
  words: string[];
  rows: string[];
}

/** Lines that hold a surah header or a basmala, keyed by line number. */
const surahOpenings = ({ page, ayat }: PageInput) => {
  const openings = new Map<number, DerivedLine>();
  for (const ayah of ayat) {
    if (ayah.aya_no !== 1) {
      continue;
    }
    const surah = ayah.sura_no;
    const hasBasmala = !NO_SEPARATE_BASMALA.has(surah);
    const headerLine = ayah.line_start - (hasBasmala ? 2 : 1);
    if (headerLine < 1) {
      fail(page, `surah ${surah} header falls off the page`);
    }
    openings.set(headerLine, { kind: "surah-header", surah });
    if (hasBasmala) {
      openings.set(headerLine + 1, { kind: "basmala", surah });
    }
  }
  return openings;
};

const ayahLineNumbers = (input: PageInput, openings: Map<number, unknown>) => {
  const lines = new Set<number>();
  for (const ayah of input.ayat) {
    for (let line = ayah.line_start; line <= ayah.line_end; line += 1) {
      if (openings.has(line)) {
        fail(input.page, `line ${line} is both an opening and an ayah line`);
      }
      lines.add(line);
    }
  }
  return [...lines].toSorted((a, b) => a - b);
};

/** The allowed index (page-local) of the first word on `nextLine`. */
const breakRange = (
  input: PageInput,
  line: number,
  nextLine: number
): [number, number] => {
  let low = 1;
  let high = Number.POSITIVE_INFINITY;
  for (const [index, ayah] of input.ayat.entries()) {
    const start = (input.firstWords[index] ?? 0) - (input.firstWords[0] ?? 0);
    const end = start + ayah.aya_text_unicode.split(" ").length - 1;
    if (ayah.line_end <= line) {
      low = Math.max(low, end + 1);
    }
    if (ayah.line_start >= nextLine) {
      high = Math.min(high, start);
    }
    if (ayah.line_start <= line && ayah.line_end >= nextLine) {
      low = Math.max(low, start + 1);
      high = Math.min(high, end);
    }
  }
  if (low > high) {
    fail(input.page, `no possible break between lines ${line} and ${nextLine}`);
  }
  return [low, high];
};

type LineCost = (index: number, from: number, to: number) => number;

/** How many letters differ between ayah line `index` (words `from` up to `to`) and its PDF row. */
const letterCost = (
  { page, words, rows }: PageInput,
  lines: number[]
): LineCost => {
  const alphabet = new Map<string, number>();
  for (const char of [...words.join(""), ...rows.join("")]) {
    if (isCountedChar(char) && !alphabet.has(char)) {
      alphabet.set(char, alphabet.size);
    }
  }
  const prefix = [Array.from({ length: alphabet.size }, () => 0)];
  for (const word of words) {
    const previous = prefix.at(-1) ?? [];
    prefix.push(
      countChars(word, alphabet).map(
        (count, slot) => count + (previous[slot] ?? 0)
      )
    );
  }
  const rowCounts = lines.map((line) => {
    const row = rows[line - 1];
    return row === undefined
      ? fail(page, `the PDF has no row for line ${line}`)
      : countChars(row, alphabet);
  });
  return (index, from, to) => {
    const row = rowCounts[index] ?? [];
    const end = prefix[to] ?? [];
    const start = prefix[from] ?? [];
    let total = 0;
    for (let slot = 0; slot < alphabet.size; slot += 1) {
      total += Math.abs(
        (row[slot] ?? 0) - ((end[slot] ?? 0) - (start[slot] ?? 0))
      );
    }
    return total;
  };
};

interface Breaks {
  cost: number;
  /** Index of the first word of each line, then the word count. */
  starts: number[];
}

/** The cheapest choice of breaks, one per range, by dynamic programming. */
const cheapestBreaks = (
  ranges: [number, number][],
  lineCost: LineCost,
  wordCount: number
): Breaks | undefined => {
  // best.get(b): cheapest lines so far, with the next line starting at word b.
  let best = new Map<number, Breaks>([[0, { cost: 0, starts: [0] }]]);
  for (const [index, [low, high]] of [
    ...ranges,
    [wordCount, wordCount] as [number, number],
  ].entries()) {
    const next = new Map<number, Breaks>();
    for (let b = low; b <= high; b += 1) {
      for (const [from, entry] of best) {
        if (from >= b) {
          continue;
        }
        const cost = entry.cost + lineCost(index, from, b);
        if (cost < (next.get(b)?.cost ?? Number.POSITIVE_INFINITY)) {
          next.set(b, { cost, starts: [...entry.starts, b] });
        }
      }
    }
    best = next;
  }
  return best.get(wordCount);
};

const deriveAyahBreaks = (input: PageInput, lines: number[]): number[] => {
  const lineCost = letterCost(input, lines);
  const ranges = lines
    .slice(0, -1)
    .map((line, index) => breakRange(input, line, lines[index + 1] ?? line));
  const winner = cheapestBreaks(ranges, lineCost, input.words.length);
  if (!winner) {
    return fail(input.page, "no way to fit the ayat into their lines");
  }
  const { starts } = winner;
  const total = (candidate: number[]): number =>
    lines.reduce(
      (sum, _, index) =>
        sum + lineCost(index, candidate[index] ?? 0, candidate[index + 1] ?? 0),
      0
    );
  // The chosen breaks must be strictly better than moving any one of them by
  // a word, or the PDF does not decide the line and the build stops.
  for (const [index, [low, high]] of ranges.entries()) {
    const at = index + 1;
    const b = starts[at] ?? 0;
    const shifts = [b - 1, b + 1].filter(
      (shifted) =>
        shifted >= low &&
        shifted <= high &&
        shifted > (starts[at - 1] ?? 0) &&
        shifted < (starts[at + 1] ?? 0)
    );
    if (
      shifts.some((shifted) => total(starts.with(at, shifted)) <= winner.cost)
    ) {
      fail(
        input.page,
        `the PDF does not decide the break after line ${lines[index]}`
      );
    }
  }
  return starts;
};

const derivePage = (input: PageInput): DerivedLine[] => {
  const openings = surahOpenings(input);
  const lines = ayahLineNumbers(input, openings);
  const starts = deriveAyahBreaks(input, lines);
  const offset = input.firstWords[0] ?? 0;
  const ayahLines = new Map<number, DerivedLine>(
    lines.map((line, index) => [
      line,
      {
        kind: "ayah",
        first: offset + (starts[index] ?? 0),
        last: offset + (starts[index + 1] ?? 0) - 1,
      },
    ])
  );
  const count = Math.max(...openings.keys(), ...lines);
  return Array.from({ length: count }, (_, index) => {
    const line = index + 1;
    return (
      openings.get(line) ??
      ayahLines.get(line) ??
      fail(input.page, `line ${line} holds nothing`)
    );
  });
};

/** Every page's lines, in page order. `pdfRows[i]` is page i + 1. */
export const deriveLines = (
  ayat: KfgqpcAyah[],
  pdfRows: string[][]
): DerivedLine[][] => {
  const firstWords: number[] = [];
  let wordCount = 0;
  for (const ayah of ayat) {
    firstWords.push(wordCount);
    wordCount += ayah.aya_text_unicode.split(" ").length;
  }
  return pdfRows.map((rows, index) => {
    const page = index + 1;
    const onPage = ayat.flatMap((ayah, at) =>
      ayah.page === page ? [{ ayah, at }] : []
    );
    if (onPage.length === 0) {
      return fail(page, "has no ayat");
    }
    return derivePage({
      page,
      rows,
      ayat: onPage.map(({ ayah }) => ayah),
      firstWords: onPage.map(({ at }) => firstWords[at] ?? 0),
      words: onPage.flatMap(({ ayah }) => ayah.aya_text_unicode.split(" ")),
    });
  });
};
