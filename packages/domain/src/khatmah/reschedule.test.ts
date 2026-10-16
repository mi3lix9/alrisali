import { AYAT } from "@alrisali/content/quran";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { readKhatmahAdjustments, withKhatmahAdjustments } from "./adjustments";
import {
  khatmahSessionRows,
  khatmahSessions,
  khatmahStatus,
  serialiseKhatmahPlan,
  sessionDueDate,
} from "./khatmah";
import type { Khatmah, KhatmahLog } from "./khatmah";
import {
  lastAyahOnPage,
  markDoneTill,
  portionEndContaining,
  reschedule,
} from "./reschedule";

const START = Temporal.PlainDate.from("2026-10-01");
/** The thirtieth day, standing in for 29 Ramadan. */
const END = START.add({ days: 29 });

const base: Khatmah = {
  id: "k1",
  plan: { kind: "suggested" },
  startDate: START,
  reminderAt: null,
  createdAt: 0,
};

const logsFor = (count: number): KhatmahLog[] =>
  Array.from({ length: count }, (_, index) => ({
    khatmahId: "k1",
    session: index + 1,
    date: START.add({ days: index }),
  }));

const adjusted = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  mode: "extendEnd" | "keepEnd",
  today: Temporal.PlainDate
): Khatmah => {
  const result = reschedule(khatmah, logs, mode, today);
  if (!result) {
    throw new Error("expected a reschedule");
  }
  return { ...khatmah, adjust: result.adjust };
};

/** The Khatmah and logs after a mark, which must have changed something. */
const afterMark = (
  khatmah: Khatmah,
  marked: ReturnType<typeof markDoneTill>
): { khatmah: Khatmah; logs: KhatmahLog[] } => {
  if (!marked) {
    throw new Error("expected a mark");
  }
  return {
    khatmah: { ...khatmah, adjust: marked.adjust },
    logs: marked.logs,
  };
};

const position = (key: string): number =>
  AYAT.findIndex((ayah) => ayah.key === key);

const expectWholeQuranInOrder = (
  sessions: ReturnType<typeof khatmahSessions>
): void => {
  let next = 0;
  for (const session of sessions) {
    expect(position(session.from)).toBe(next);
    next = position(session.to) + 1;
  }
  expect(next).toBe(AYAT.length);
};

const partlyRead = () => {
  const till = AYAT.findLast((ayah) => ayah.page === 2)?.key ?? "1:1";
  return afterMark(base, markDoneTill(base, [], till, START));
};

describe("rescheduling after a partial read", () => {
  it.each(["extendEnd", "keepEnd"] as const)(
    "keeps the pages already read when the end is %s",
    (mode) => {
      const { khatmah, logs } = partlyRead();
      const before = khatmahStatus(khatmah, logs, START).pagesRead;
      const later = START.add({ days: 5 });
      const after = khatmahStatus(
        adjusted(khatmah, logs, mode, later),
        logs,
        later
      );

      expect(before).toBe(2);
      expect(after.pagesRead).toBe(before);
      const sessions = khatmahSessions(
        adjusted(khatmah, logs, mode, later),
        logs
      );
      expect(sessions.at(-1)?.to).toBe(AYAT.at(-1)?.key);
    }
  );
});

describe(reschedule, () => {
  const today = START.add({ days: 10 });
  const logs = logsFor(5);

  it("is behind before it reschedules", () => {
    const status = khatmahStatus(base, logs, today);
    expect([status.state, status.sessions]).toStrictEqual(["behind", 5]);
  });

  it("extendEnd keeps the portions and pushes the end date back", () => {
    const next = adjusted(base, logs, "extendEnd", today);
    const sessions = khatmahSessions(next, logs);

    expect(sessions.map(({ from, to }) => [from, to])).toStrictEqual(
      khatmahSessions(base, logs).map(({ from, to }) => [from, to])
    );
    expect(sessionDueDate(next, 6).equals(today)).toBeTruthy();
    expect(
      sessionDueDate(next, 30).equals(today.add({ days: 24 }))
    ).toBeTruthy();
    const status = khatmahStatus(next, logs, today);
    expect([status.state, status.current?.number]).toStrictEqual([
      "on-track",
      6,
    ]);
    expect(status.plannedFinish.since(END).days).toBeGreaterThan(0);
  });

  it("keepEnd keeps the end date, enlarging the portions left", () => {
    const next = adjusted(base, logs, "keepEnd", today);
    const sessions = khatmahSessions(next, logs);

    // 20 days remain from today to the end date, so 20 sessions rather than 25.
    expect(sessions).toHaveLength(25);
    expect(sessionDueDate(next, sessions.length).equals(END)).toBeTruthy();
    expectWholeQuranInOrder(sessions);
    const before = khatmahSessions(base, logs).at(5);
    expect(sessions.at(5)?.pages).toBeGreaterThan(before?.pages ?? 0);
    expect(khatmahStatus(next, logs, today).state).toBe("on-track");
  });

  it("keepEnd still finishes on the end date from any day before it", () => {
    for (let offset = 6; offset <= 29; offset += 1) {
      const day = START.add({ days: offset });
      const next = adjusted(base, logs, "keepEnd", day);
      const sessions = khatmahSessions(next, logs);
      expectWholeQuranInOrder(sessions);
      expect(
        sessionDueDate(next, sessions.length).until(END).sign
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("refuses keepEnd once the end date has passed, but extendEnd still works", () => {
    const late = END.add({ days: 2 });
    expect(reschedule(base, logs, "keepEnd", late)).toBeNull();
    expect(reschedule(base, logs, "extendEnd", late)).not.toBeNull();
  });

  it("does nothing for a finished Khatmah", () => {
    expect(reschedule(base, logsFor(30), "extendEnd", today)).toBeNull();
  });

  it("works from a second reschedule, keeping the first's sessions", () => {
    const once = adjusted(base, logs, "keepEnd", today);
    const moreLogs = logsFor(8);
    const twice = adjusted(once, moreLogs, "keepEnd", today.add({ days: 2 }));
    const sessions = khatmahSessions(twice, moreLogs);

    expectWholeQuranInOrder(sessions);
    expect(sessionDueDate(twice, sessions.length).until(END).sign).toBe(0);
    expect(khatmahSessionRows(twice, moreLogs, today)[7]?.state).toBe("done");
  });

  it("stores its changes in the plan's JSON and reads them back", () => {
    const next = adjusted(base, logs, "keepEnd", today);
    const stored = withKhatmahAdjustments(
      serialiseKhatmahPlan(base.plan),
      next.adjust ?? { segments: [], partial: null }
    );

    expect(JSON.parse(stored)).toMatchObject({ kind: "suggested" });
    expect(readKhatmahAdjustments(stored)).toStrictEqual(next.adjust);
    expect(
      readKhatmahAdjustments(serialiseKhatmahPlan(base.plan)).segments
    ).toStrictEqual([]);
    expect(
      withKhatmahAdjustments(stored, { segments: [], partial: null })
    ).toBe(serialiseKhatmahPlan(base.plan));
  });
});

describe(markDoneTill, () => {
  it("completes the sessions it covers and keeps the rest of the one it ends in", () => {
    const [first, second] = khatmahSessions(base, []);
    const till = AYAT[position(second?.from ?? "1:1") + 3]?.key ?? "1:1";
    const marked = markDoneTill(base, [], till, START);

    expect(marked?.adjust.partial).toStrictEqual({ session: 2, till });

    const after = afterMark(base, marked);
    const status = khatmahStatus(after.khatmah, after.logs, START);
    expect([status.done, status.current?.number]).toStrictEqual([1, 2]);
    expect(status.current?.from).toBe(AYAT[position(till) + 1]?.key);
    expect(status.current?.to).toBe(second?.to);
    // Session 1 and the pages inside the part of session 2 already read.
    expect(status.pagesRead).toBeGreaterThanOrEqual(first?.pages ?? 0);
  });

  it("counts the pages inside a part read, not only whole sessions", () => {
    const [first] = khatmahSessions(base, []);
    const wholeOnly = khatmahStatus(base, [], START).pagesRead;
    const till = AYAT.findLast((ayah) => ayah.page === 2)?.key ?? "1:1";
    const marked = markDoneTill(base, [], till, START);
    const after = afterMark(base, marked);
    const status = khatmahStatus(after.khatmah, after.logs, START);

    expect(wholeOnly).toBe(0);
    expect(first?.lastPage).toBeGreaterThan(2);
    expect(status.pagesRead).toBe(2);
  });

  it("completes the whole portion when it ends at the portion's end", () => {
    const [first] = khatmahSessions(base, []);
    const marked = markDoneTill(base, [], first?.to ?? "1:1", START);

    expect(marked?.logs).toStrictEqual([
      { khatmahId: "k1", session: 1, date: START },
    ]);
    expect(marked?.adjust.partial).toBeNull();
  });

  it("completes several sessions at once", () => {
    const third = khatmahSessions(base, []).at(2);
    const marked = markDoneTill(base, [], third?.to ?? "1:1", START);

    expect(marked?.logs.map(({ session }) => session)).toStrictEqual([1, 2, 3]);
  });

  it("changes nothing for an ayah already read", () => {
    const marked = markDoneTill(base, logsFor(2), "1:1", START);
    expect(marked).toBeNull();
  });

  it("finishes the Khatmah when marked till the last ayah", () => {
    const marked = markDoneTill(base, [], "114:6", START);
    const after = afterMark(base, marked);
    expect(khatmahStatus(after.khatmah, after.logs, START).state).toBe(
      "finished"
    );
  });

  it("names where a page and a portion end", () => {
    expect(lastAyahOnPage(1)).toBe("1:7");
    const [, inSecond] = khatmahSessions(base, []);
    expect(portionEndContaining(base, [], inSecond?.from ?? "1:1")).toBe(
      inSecond?.to
    );
  });
});
