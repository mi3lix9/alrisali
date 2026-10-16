// Reads the text layer of the KFGQPC mushaf PDF as rows of glyph runs, one
// row per printed line, top to bottom. Needs poppler's `pdftotext` on PATH.
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const WORD =
  /<word xMin="[\d.]+" yMin="[\d.]+" xMax="[\d.]+" yMax="(?<baseline>[\d.]+)">(?<text>[^<]*)<\/word>/gu;
/** Printed lines sit ~38pt apart; marks of one line drift a few points. */
const ROW_GAP = 15;

/** Letters and the hizb/sajda signs: what the PDF text layer reliably keeps. */
export const isCountedChar = (char: string): boolean =>
  char === "۞" || char === "۩" || /\p{Lo}/u.test(char);

interface Run {
  baseline: number;
  text: string;
}

const toRows = (runs: Run[]): string[] => {
  const sorted = runs.toSorted((a, b) => a.baseline - b.baseline);
  const rows: Run[][] = [];
  for (const run of sorted) {
    const row = rows.at(-1);
    const last = row?.at(-1);
    if (row && last && run.baseline - last.baseline < ROW_GAP) {
      row.push(run);
    } else {
      rows.push([run]);
    }
  }
  return rows.map((row) => row.map((run) => run.text).join(""));
};

/** Text of each printed row, per page (index 0 = page 1). */
export const readPdfRows = (pdf: Uint8Array): string[][] => {
  const pdfPath = path.join(tmpdir(), `kfgqpc-${process.pid}.pdf`);
  writeFileSync(pdfPath, pdf);
  try {
    const result = Bun.spawnSync(["pdftotext", "-bbox", pdfPath, "-"]);
    if (!result.success) {
      throw new Error(`pdftotext: ${result.stderr.toString()}`);
    }
    const html = result.stdout.toString();
    return html
      .split("<page ")
      .slice(1)
      .map((page) =>
        toRows(
          [...page.matchAll(WORD)]
            .map(({ groups }) => ({
              baseline: Number(groups?.baseline),
              text: groups?.text ?? "",
            }))
            .filter((run) => [...run.text].some(isCountedChar))
        )
      );
  } finally {
    rmSync(pdfPath, { force: true });
  }
};
