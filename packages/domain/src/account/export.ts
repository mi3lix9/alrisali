/** One table of the Believer's database, its rows in column order. */
export interface UserTable {
  name: string;
  columns: readonly string[];
  rows: readonly (readonly unknown[])[];
}

export interface UserDataExport {
  fileName: string;
  mimeType: string;
  content: string;
}

/**
 * Everything the Believer recorded as one JSON file: each table keyed by its
 * name, each row an object keyed by column, empty tables included. Stored
 * bytes become a list of byte values (JSON has no bytes). The file is named
 * after the UTC day of `exportedAt`.
 */
export const exportUserData = (
  tables: readonly UserTable[],
  exportedAt: Date
): UserDataExport => {
  const iso = exportedAt.toISOString();
  const content = {
    exportedAt: iso,
    tables: Object.fromEntries(
      tables.map((table) => [
        table.name,
        table.rows.map((row) =>
          Object.fromEntries(
            table.columns.map((column, index) => {
              const value = row[index];
              return [
                column,
                value instanceof ArrayBuffer
                  ? [...new Uint8Array(value)]
                  : value,
              ];
            })
          )
        ),
      ])
    ),
  };
  return {
    fileName: `alrisali-data-${iso.slice(0, "yyyy-mm-dd".length)}.json`,
    mimeType: "application/json",
    content: JSON.stringify(content, null, 2),
  };
};
