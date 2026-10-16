import { describe, expect, it } from "vitest";

import { exportUserData } from "./export";

const EXPORTED_AT = new Date(Date.UTC(2026, 9, 15, 18, 30));

describe(exportUserData, () => {
  it("writes every table as named rows in one JSON file", () => {
    const file = exportUserData(
      [
        {
          name: "favorites",
          columns: ["kind", "key", "favorited_at"],
          rows: [["ayah", "2:255", 1_760_000_000_000]],
        },
        {
          name: "dhikr_sessions",
          columns: ["id", "tasbih_id", "count"],
          rows: [
            ["a", "tasbih-al-zahra", 100],
            ["b", "open-1", null],
          ],
        },
      ],
      EXPORTED_AT
    );

    expect(file.fileName).toBe("alrisali-data-2026-10-15.json");
    expect(file.mimeType).toBe("application/json");
    expect(JSON.parse(file.content)).toStrictEqual({
      exportedAt: "2026-10-15T18:30:00.000Z",
      tables: {
        favorites: [
          { kind: "ayah", key: "2:255", favorited_at: 1_760_000_000_000 },
        ],
        dhikr_sessions: [
          { id: "a", tasbih_id: "tasbih-al-zahra", count: 100 },
          { id: "b", tasbih_id: "open-1", count: null },
        ],
      },
    });
  });

  it("keeps an empty table, so the file shows it was there", () => {
    const file = exportUserData(
      [{ name: "prayer_logs", columns: ["id"], rows: [] }],
      EXPORTED_AT
    );

    expect(JSON.parse(file.content).tables).toStrictEqual({ prayer_logs: [] });
  });

  it("writes stored bytes as a list of numbers", () => {
    const bytes = new Uint8Array([1, 2, 255]).buffer;
    const file = exportUserData(
      [{ name: "blobs", columns: ["data"], rows: [[bytes]] }],
      EXPORTED_AT
    );

    expect(JSON.parse(file.content).tables.blobs).toStrictEqual([
      { data: [1, 2, 255] },
    ]);
  });
});
