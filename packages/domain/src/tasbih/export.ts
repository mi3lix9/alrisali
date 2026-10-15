import type { DhikrSession } from "./tasbih";

export type DhikrSessionExportFormat = "csv" | "json";

export interface DhikrSessionExport {
  fileName: string;
  mimeType: string;
  content: string;
}

const CSV_HEADER = ["id", "tasbih_id", "tasbih_name", "count", "completed_at"];
const CSV_LINE_END = "\r\n";
// Spreadsheets run a cell starting with one of these as a formula.
const FORMULA_START = /^[=+\-@\t\r]/u;
const NEEDS_QUOTES = /[",\r\n]/u;
const QUOTE = /"/gu;
interface ExportedSession {
  id: string;
  tasbihId: string;
  tasbihName: string;
  count: number;
  completedAt: string;
}

const csvCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(QUOTE, '""')}"` : safe;
};

const toCsv = (rows: ExportedSession[]): string =>
  [
    CSV_HEADER,
    ...rows.map((row) => [
      row.id,
      row.tasbihId,
      row.tasbihName,
      String(row.count),
      row.completedAt,
    ]),
  ]
    .map((cells) => cells.map(csvCell).join(",") + CSV_LINE_END)
    .join("");

/**
 * The Believer's Dhikr Sessions as a CSV or JSON file, in the order given.
 * Each session carries its Tasbih's name from `tasbihNames` (empty when the
 * Tasbih has since been deleted) and its completion time in ISO 8601 UTC.
 */
export const exportDhikrSessions = (
  sessions: readonly DhikrSession[],
  tasbihNames: ReadonlyMap<string, string>,
  format: DhikrSessionExportFormat
): DhikrSessionExport => {
  const rows = sessions.map((session): ExportedSession => ({
    id: session.id,
    tasbihId: session.tasbihId,
    tasbihName: tasbihNames.get(session.tasbihId) ?? "",
    count: session.count,
    completedAt: new Date(session.completedAt).toISOString(),
  }));
  if (format === "csv") {
    return {
      fileName: "dhikr-sessions.csv",
      mimeType: "text/csv",
      content: toCsv(rows),
    };
  }
  return {
    fileName: "dhikr-sessions.json",
    mimeType: "application/json",
    content: JSON.stringify(rows, null, 2),
  };
};
