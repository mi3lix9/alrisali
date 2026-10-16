import { getSupplication } from "@alrisali/content/books";
import { describe, expect, it } from "vitest";

import { migrations } from "../shared/migrations";

/** The Supplication ids a migration's INSERT statements name. */
const seededIds = (statements: readonly string[]): string[] =>
  statements
    .filter((statement) => /^\s*INSERT\b/iu.test(statement))
    .flatMap((statement) =>
      [...statement.matchAll(/'(?<value>[^']+)'/gu)].map(
        (match) => match.groups?.value ?? ""
      )
    )
    .filter((value) => /^(?:sahifa|mafatih|nahj)-/u.test(value));

describe("seeded worship mapping", () => {
  const migration = migrations.find(({ tag }) =>
    tag.endsWith("_worship_mapping")
  );

  it("maps only Supplications the bundled Books hold", () => {
    const ids = seededIds(migration?.statements ?? []);

    expect(ids).toContain("mafatih-dua-kumayl");
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(getSupplication(id)?.id).toBe(id);
    }
  });

  it("seeds Kumayl for Thursday night and the weekday duas for all seven days", () => {
    const sql = (migration?.statements ?? []).join("\n");

    expect(sql).toContain("('night-dua', 'thursday', 'mafatih-dua-kumayl')");
    expect(sql.match(/'sahifa-weekday-\w+'/gu)).toHaveLength(7);
  });
});
