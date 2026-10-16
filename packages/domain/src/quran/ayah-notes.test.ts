import { describe, expect, it } from "vitest";

import {
  AYAH_NOTE_MAX,
  insertAtCursor,
  notedAyat,
  sortNotes,
  writeNote,
} from "./ayah-notes";

const NOW = new Date("2026-10-16T08:00:00.000Z");
const LATER = new Date("2026-10-17T08:00:00.000Z");

describe(writeNote, () => {
  it("keeps at most one note per ayah: editing replaces it", () => {
    const first = writeNote([], "2:255", "Ayat al-Kursi", NOW);
    const edited = writeNote(first, "2:255", "Read after every prayer", LATER);

    expect(edited).toStrictEqual([
      {
        ayah: "2:255",
        text: "Read after every prayer",
        updatedAt: LATER.toISOString(),
      },
    ]);
  });

  it("keeps notes on other ayat untouched", () => {
    const notes = writeNote(writeNote([], "1:1", "a", NOW), "112:1", "b", NOW);

    expect(sortNotes(notes).map((note) => note.ayah)).toStrictEqual([
      "1:1",
      "112:1",
    ]);
  });

  it("removes the note when the text is blank", () => {
    const notes = writeNote([], "1:1", "a", NOW);

    expect(writeNote(notes, "1:1", "  \n ", LATER)).toStrictEqual([]);
  });

  it("caps a very long note", () => {
    const [note] = writeNote([], "1:1", "ا".repeat(AYAH_NOTE_MAX + 50), NOW);

    expect(note?.text).toHaveLength(AYAH_NOTE_MAX);
  });

  it("refuses an ayah the mushaf does not have", () => {
    expect(() => writeNote([], "115:1", "x", NOW)).toThrow("115:1");
  });
});

describe(sortNotes, () => {
  it("lists notes in mushaf order and drops ayat this mushaf lacks", () => {
    const notes = [
      { ayah: "112:1", text: "c", updatedAt: "" },
      { ayah: "999:1", text: "x", updatedAt: "" },
      { ayah: "2:255", text: "b", updatedAt: "" },
      { ayah: "1:1", text: "a", updatedAt: "" },
    ] as const;

    expect(sortNotes(notes).map((note) => note.ayah)).toStrictEqual([
      "1:1",
      "2:255",
      "112:1",
    ]);
  });
});

describe(notedAyat, () => {
  it("names the ayat that carry a note", () => {
    expect(
      notedAyat(writeNote([], "2:255", "x", NOW)).has("2:255")
    ).toBeTruthy();
  });
});

describe(insertAtCursor, () => {
  it("inserts at the cursor on its own line and leaves the cursor after it", () => {
    const result = insertAtCursor("before after", { start: 7, end: 7 }, "AYAH");

    expect(result.text).toBe("before \nAYAH\nafter");
    expect(result.selection).toStrictEqual({ start: 13, end: 13 });
  });

  it("adds no blank line at the start or end of the note", () => {
    expect(insertAtCursor("", { start: 0, end: 0 }, "AYAH").text).toBe("AYAH");
    expect(insertAtCursor("hi\n", { start: 3, end: 3 }, "AYAH").text).toBe(
      "hi\nAYAH"
    );
  });

  it("replaces the selected text", () => {
    expect(insertAtCursor("abcdef", { start: 0, end: 6 }, "AYAH").text).toBe(
      "AYAH"
    );
  });

  it("clamps a cursor beyond the text", () => {
    expect(insertAtCursor("ab", { start: 9, end: 9 }, "X").text).toBe("ab\nX");
  });
});
