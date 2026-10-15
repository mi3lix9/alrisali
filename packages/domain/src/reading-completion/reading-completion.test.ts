import { describe, expect, it } from "vitest";

import {
  readingCompletionId,
  readingCompletionSchema,
  readingDate,
} from "./reading-completion";

describe("Reading Completion", () => {
  it("dates a reading by the Believer's local calendar day", () => {
    expect(readingDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(readingDate(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });

  it("accepts a Supplication and a calendar date", () => {
    const completion = { supplicationId: "sahifa-1", date: "2026-10-15" };

    expect(readingCompletionSchema.parse(completion)).toStrictEqual(completion);
  });

  it("rejects a date that is not a calendar day and an empty Supplication", () => {
    for (const completion of [
      { supplicationId: "sahifa-1", date: "2026-02-30" },
      { supplicationId: "sahifa-1", date: "15/10/2026" },
      { supplicationId: "", date: "2026-10-15" },
    ]) {
      expect(readingCompletionSchema.safeParse(completion).success).toBeFalsy();
    }
  });

  it("gives one reading of a Supplication per day the same id on every device", () => {
    expect(
      readingCompletionId({ supplicationId: "sahifa-1", date: "2026-10-15" })
    ).toBe("sahifa-1@2026-10-15");
  });
});
