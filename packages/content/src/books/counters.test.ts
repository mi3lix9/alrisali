import { describe, expect, it } from "vitest";

import { COUNTERS, countersOf, getSupplication, loadSupplicationText } from ".";

const NUMBER_WORDS: Record<number, RegExp> = {
  100: /hundred/iu,
  1000: /thousand/iu,
};

const textsOfMarked = () =>
  Promise.all(
    Object.entries(COUNTERS).map(
      async ([id, marks]) => [marks, await loadSupplicationText(id)] as const
    )
  );

describe("counter marks integrity", () => {
  it("marks only bundled Supplications", () => {
    for (const id of Object.keys(COUNTERS)) {
      expect(getSupplication(id)?.id).toBe(id);
    }
  });

  it("marks only passages that exist, each once, with a positive whole target", async () => {
    for (const [marks, passages] of await textsOfMarked()) {
      const seen = new Set<number>();
      for (const { passage, target } of marks) {
        expect(passage).toBeGreaterThanOrEqual(0);
        expect(passage).toBeLessThan(passages.length);
        expect(seen.has(passage)).toBeFalsy();
        seen.add(passage);
        expect(Number.isInteger(target) && target > 0).toBeTruthy();
      }
    }
  });

  it("marks a passage only where the bundled text asks for that many repetitions", async () => {
    for (const [marks, passages] of await textsOfMarked()) {
      for (const { passage, target } of marks) {
        const english = passages[passage]?.en ?? "";
        expect(english).toMatch(/times/iu);
        expect(english).toMatch(NUMBER_WORDS[target] ?? /^$/u);
      }
    }
  });

  it("looks counters up by passage index", () => {
    expect(countersOf("sahifa-48").get(192)?.target).toBe(1000);
    expect(countersOf("sahifa-1").size).toBe(0);
  });
});
