import type { ReceivedContactMessage } from "@alrisali/api/contact";
import { describe, expect, it } from "vitest";

import { keepOpenMessage } from "./open-message";

const message = (
  id: string,
  createdAt: string,
  overrides: Partial<ReceivedContactMessage> = {}
): ReceivedContactMessage => ({
  id,
  name: "Believer",
  email: "believer@example.com",
  subject: `Subject ${id}`,
  message: "Body",
  status: "new",
  fromBeliever: true,
  userAgent: null,
  createdAt: new Date(createdAt),
  ...overrides,
});

const ids = (messages: ReceivedContactMessage[]) =>
  messages.map(({ id }) => id);

describe(keepOpenMessage, () => {
  const newest = message("c", "2026-10-03");
  const middle = message("b", "2026-10-02");
  const oldest = message("a", "2026-10-01");

  it("returns the list unchanged when nothing is open", () => {
    expect(ids(keepOpenMessage([newest, oldest], null))).toStrictEqual([
      "c",
      "a",
    ]);
  });

  it("uses the list's copy when the open message is still listed", () => {
    const listed = { ...middle, status: "read" as const };
    const kept = keepOpenMessage([newest, listed, oldest], middle);
    expect(kept).toStrictEqual([newest, listed, oldest]);
  });

  it("keeps a message that left the filtered list in its place, newest first", () => {
    // Opened under "new", then marked read: the "new" refetch drops it.
    const opened = { ...middle, status: "read" as const };
    const kept = keepOpenMessage([newest, oldest], opened);
    expect(ids(kept)).toStrictEqual(["c", "b", "a"]);
    expect(kept[1]).toBe(opened);
  });

  it("keeps it at the end when it is older than every listed message", () => {
    expect(ids(keepOpenMessage([newest], oldest))).toStrictEqual(["c", "a"]);
    expect(ids(keepOpenMessage([], oldest))).toStrictEqual(["a"]);
  });
});
