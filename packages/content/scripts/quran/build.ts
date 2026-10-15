#!/usr/bin/env bun
// Builds the bundled Quran dataset from KFGQPC's Hafs v30 developer release
// (ADR-0004). One-time; re-run only for a new KFGQPC release.
//
//   bun scripts/quran/build.ts [path/to/kfgqpc_hafs_v30.zip]
//
// Needs `unzip` and poppler's `pdftotext`. Without a path it downloads the
// zip to the OS temp folder. It writes src/quran/data/ (dataset and the
// unmodified font) and notices/kfgqpc.md, and stops if the lines it derives
// from the PDF disagree with the release's Word source.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { SURAH_HEADER_PREFIX } from "../../src/quran/dataset";
import type { HafsDataset, LineRow } from "../../src/quran/dataset";
import { deriveLines } from "./derive-lines";
import type { DerivedLine } from "./derive-lines";
import { readDocxLines } from "./docx-lines";
import { readFontLicense } from "./font-license";
import { isCountedChar, readPdfRows } from "./pdf-rows";
import {
  KFGQPC_PAGE_URL,
  KFGQPC_ZIP_SHA256,
  loadZip,
  MEMBERS,
  parseAyat,
  readMember,
  sha256,
} from "./source";
import type { KfgqpcAyah } from "./source";

const PACKAGE_ROOT = path.join(import.meta.dir, "../..");
const DATA_DIR = path.join(PACKAGE_ROOT, "src/quran/data");
const NOTICE_PATH = path.join(PACKAGE_ROOT, "notices/kfgqpc.md");
const FONT_FILE = "kfgqpc_hafs_v30.ttf";
const SURAH_COUNT = 114;
/** Base letters only: KFGQPC orders the marks of some basmalas differently. */
const letters = (text: string): string =>
  [...text].filter((char) => isCountedChar(char)).join("");
const BASMALA_LETTERS = letters("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ");

const surahNames = (ayat: KfgqpcAyah[]): [string, string][] =>
  Array.from({ length: SURAH_COUNT }, (_, index) => {
    const first = ayat.find((ayah) => ayah.sura_no === index + 1);
    if (!first) {
      throw new Error(`Surah ${index + 1} has no ayat`);
    }
    return [first.sura_name_ar, first.sura_name_en];
  });

/** Confirms the derived lines match the Word source, line by line. */
const toLineRows = (
  derived: DerivedLine[][],
  docx: string[][],
  words: string[],
  names: [string, string][]
): LineRow[][] => {
  if (docx.length !== derived.length) {
    throw new Error(
      `Word source has ${docx.length} pages, not ${derived.length}`
    );
  }
  return derived.map((lines, pageIndex) => {
    const typed = docx[pageIndex] ?? [];
    const where = (line: number) => `page ${pageIndex + 1} line ${line + 1}`;
    if (typed.length !== lines.length) {
      throw new Error(
        `page ${pageIndex + 1}: derived ${lines.length} lines, Word source has ${typed.length}`
      );
    }
    return lines.map((line, lineIndex): LineRow => {
      const text = typed[lineIndex] ?? "";
      if (line.kind === "surah-header") {
        const expected = `${SURAH_HEADER_PREFIX}${names[line.surah - 1]?.[0]}`;
        if (text !== expected) {
          throw new Error(
            `${where(lineIndex)}: header "${text}" ≠ "${expected}"`
          );
        }
        return ["h", line.surah];
      }
      if (line.kind === "basmala") {
        if (letters(text) !== BASMALA_LETTERS) {
          throw new Error(`${where(lineIndex)}: "${text}" is not a basmala`);
        }
        return ["b", line.surah, text];
      }
      const derivedText = words.slice(line.first, line.last + 1).join(" ");
      if (text.split(/\s+/u).join(" ") !== derivedText) {
        throw new Error(
          `${where(lineIndex)}: PDF gives "${derivedText}", Word source "${text}"`
        );
      }
      return [line.first, line.last];
    });
  });
};

const noticeText = (font: Uint8Array): string => {
  const { copyright, license } = readFontLicense(font);
  return `# King Fahd Glorious Quran Printing Complex (KFGQPC)

The Quran text, the page and line of every ayah on the 604 fifteen-line Madinah pages, and the KFGQPC HAFS Uthmanic Script font come from KFGQPC's developer release for Hafs, \`kfgqpc_hafs_v30\` (${KFGQPC_PAGE_URL}, zip SHA-256 ${KFGQPC_ZIP_SHA256}).

- The text is reproduced verbatim. Where an ayah that spans several lines breaks was worked out from the mushaf PDF in the same release.
- The font is bundled unmodified, under the licence embedded in it (quoted verbatim below).

## Font copyright

\`\`\`text
${copyright}
\`\`\`

## Font licence

\`\`\`text
${license}
\`\`\`
`;
};

const main = async () => {
  const zipPath = await loadZip(process.argv[2]);
  const ayat = parseAyat(readMember(zipPath, MEMBERS.json));
  const font = readMember(zipPath, MEMBERS.font);
  const docxPath = path.join(tmpdir(), `kfgqpc-${process.pid}.docx`);
  writeFileSync(docxPath, readMember(zipPath, MEMBERS.docx));
  const documentXml = new TextDecoder().decode(
    readMember(docxPath, "word/document.xml")
  );
  rmSync(docxPath);

  const names = surahNames(ayat);
  const words = ayat.flatMap((ayah) => ayah.aya_text_unicode.split(" "));
  const derived = deriveLines(
    ayat,
    readPdfRows(readMember(zipPath, MEMBERS.pdf))
  );
  const pages = toLineRows(derived, readDocxLines(documentXml), words, names);
  const notice = noticeText(font);

  const dataset: HafsDataset = {
    source: {
      release: "kfgqpc_hafs_v30",
      url: KFGQPC_PAGE_URL,
      zipSha256: KFGQPC_ZIP_SHA256,
      textSha256: sha256(
        new TextEncoder().encode(
          ayat.map((ayah) => ayah.aya_text_unicode).join("\n")
        )
      ),
    },
    notice,
    surahs: names,
    ayat: ayat.map((ayah) => [
      ayah.sura_no,
      ayah.aya_no,
      ayah.jozz,
      ayah.page,
      ayah.line_start,
      ayah.line_end,
      ayah.aya_text_unicode,
    ]),
    pages,
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    path.join(DATA_DIR, "hafs.ts"),
    `// Generated by scripts/quran/build.ts from KFGQPC kfgqpc_hafs_v30. Do not edit.
// See notices/kfgqpc.md. Parsed from a string: faster to load than a literal.
import type { HafsDataset } from "../dataset";

export const HAFS: HafsDataset = JSON.parse(${JSON.stringify(JSON.stringify(dataset))});
`
  );
  writeFileSync(path.join(DATA_DIR, FONT_FILE), font);
  writeFileSync(NOTICE_PATH, notice);
  console.log(
    `Wrote ${pages.length} pages, ${ayat.length} ayat, ${words.length} words.`
  );
};

await main();
