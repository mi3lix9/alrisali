import { describe, expect, it } from "vitest";

import { exportDhikrSessions } from "./export";
import type { DhikrSession } from "./tasbih";

const sessions: DhikrSession[] = [
  {
    id: "b",
    tasbihId: "open-1",
    count: 33,
    completedAt: Date.UTC(2026, 9, 15, 18, 30),
  },
  {
    id: "a",
    tasbihId: "tasbih-al-zahra",
    count: 100,
    completedAt: Date.UTC(2026, 9, 15, 5, 0, 12),
  },
];

const names = new Map([
  ["tasbih-al-zahra", "Tasbih al-Zahra"],
  ["open-1", 'Salawat, "after Fajr"'],
]);

describe(exportDhikrSessions, () => {
  it("writes CSV with a header row, quoting commas and quotes", () => {
    const file = exportDhikrSessions(sessions, names, "csv");

    expect(file).toStrictEqual({
      fileName: "dhikr-sessions.csv",
      mimeType: "text/csv",
      content: [
        "id,tasbih_id,tasbih_name,count,completed_at",
        'b,open-1,"Salawat, ""after Fajr""",33,2026-10-15T18:30:00.000Z',
        "a,tasbih-al-zahra,Tasbih al-Zahra,100,2026-10-15T05:00:12.000Z",
        "",
      ].join("\r\n"),
    });
  });

  it("writes JSON with each session's Tasbih name and ISO time", () => {
    const file = exportDhikrSessions(sessions, names, "json");

    expect(file.fileName).toBe("dhikr-sessions.json");
    expect(file.mimeType).toBe("application/json");
    expect(JSON.parse(file.content)).toStrictEqual([
      {
        id: "b",
        tasbihId: "open-1",
        tasbihName: 'Salawat, "after Fajr"',
        count: 33,
        completedAt: "2026-10-15T18:30:00.000Z",
      },
      {
        id: "a",
        tasbihId: "tasbih-al-zahra",
        tasbihName: "Tasbih al-Zahra",
        count: 100,
        completedAt: "2026-10-15T05:00:12.000Z",
      },
    ]);
  });

  it("leaves the name empty for a Tasbih since deleted", () => {
    const file = exportDhikrSessions(
      [{ id: "c", tasbihId: "gone", count: 7, completedAt: 0 }],
      names,
      "csv"
    );

    expect(file.content.split("\r\n")[1]).toBe(
      "c,gone,,7,1970-01-01T00:00:00.000Z"
    );
  });

  it("keeps a spreadsheet from reading a name as a formula", () => {
    const file = exportDhikrSessions(
      [{ id: "d", tasbihId: "open-2", count: 1, completedAt: 0 }],
      new Map([["open-2", "=HYPERLINK(1)"]]),
      "csv"
    );

    expect(file.content.split("\r\n")[1]).toBe(
      "d,open-2,'=HYPERLINK(1),1,1970-01-01T00:00:00.000Z"
    );
  });

  it("exports no sessions as a header alone, or an empty list", () => {
    expect(exportDhikrSessions([], names, "csv").content).toBe(
      "id,tasbih_id,tasbih_name,count,completed_at\r\n"
    );
    expect(
      JSON.parse(exportDhikrSessions([], names, "json").content)
    ).toStrictEqual([]);
  });
});
