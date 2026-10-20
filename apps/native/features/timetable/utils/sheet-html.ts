import { SHEET_COLORS } from "./sheet";
import type { Sheet, SheetMark } from "./sheet";

/** A PDF page, in points (US Letter, the printer's default). */
export const PDF_PAGE = { width: 612, height: 792 } as const;

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string): string =>
  text.replaceAll(/[&<>"']/gu, (character) => ESCAPES[character] ?? character);

const MARK_COLORS: Record<SheetMark, string> = {
  today: SHEET_COLORS.today,
  friday: SHEET_COLORS.friday,
  qadr: SHEET_COLORS.qadr,
};

/**
 * The page the PDF prints: the sheet as one table on a single page, in the
 * interface's direction, with the same colours the image has.
 */
export const sheetHtml = (sheet: Sheet, direction: "rtl" | "ltr"): string => {
  const head = sheet.headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");
  const body = sheet.rows
    .map(({ cells, mark, tag }) => {
      const background = mark ? ` style="background:${MARK_COLORS[mark]}"` : "";
      const columns = cells
        .map((cell, index) => {
          const note =
            index === 0 && tag ? ` <small>${escapeHtml(tag)}</small>` : "";
          return `<td>${escapeHtml(cell)}${note}</td>`;
        })
        .join("");
      return `<tr${background}>${columns}</tr>`;
    })
    .join("");
  return `<!doctype html>
<html dir="${direction}" lang="${direction === "rtl" ? "ar" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { margin: 28pt; }
  body { margin: 0; color: ${SHEET_COLORS.text}; font-family: -apple-system, Roboto, sans-serif; }
  h1 { margin: 0; font-size: 18pt; color: ${SHEET_COLORS.accent}; }
  p { margin: 2pt 0 10pt; font-size: 10pt; color: ${SHEET_COLORS.muted}; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; text-align: center; }
  th { padding: 4pt 2pt; background: ${SHEET_COLORS.header}; }
  td { padding: 2.5pt 2pt; border-bottom: 0.5pt solid ${SHEET_COLORS.line}; }
  small { font-size: 7pt; color: ${SHEET_COLORS.accent}; }
</style>
</head>
<body>
<h1>${escapeHtml(sheet.title)}</h1>
<p>${escapeHtml(sheet.subtitle)}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`;
};
