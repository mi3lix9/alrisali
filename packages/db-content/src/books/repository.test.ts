import { describe, expect, it } from "vitest";

import { createContentDb } from "../shared/content-db";
import type { Transaction } from "../shared/content-db";
import { migrations } from "../shared/migrations";
import { createAmalRepository } from "./repository";

const setup = () => {
  const transactions: string[][] = [];
  const transaction: Transaction = (statements) => {
    transactions.push(statements.map(({ sql }) => sql));
    return Promise.resolve();
  };
  const db = createContentDb(() => Promise.resolve([]), transaction);
  return { transactions, repository: createAmalRepository(db) };
};

describe("A'mal repository", () => {
  it("replaces a day in one transaction", async () => {
    const { transactions, repository } = setup();

    await repository.replaceDay(9, 1, [
      { kind: "dua", supplicationId: "sahifa-44" },
      { kind: "dua", time: "night", supplicationId: "mafatih-dua-iftitah" },
    ]);

    expect(transactions).toHaveLength(1);
    expect(transactions[0]?.[0]).toMatch(/^delete/iu);
    expect(transactions[0]?.[1]).toMatch(/^insert/iu);
  });

  it("clears a day in one transaction when nothing is listed", async () => {
    const { transactions, repository } = setup();

    await repository.replaceDay(9, 1, []);

    expect(transactions).toStrictEqual([[expect.stringMatching(/^delete/iu)]]);
  });
});

describe("seeded A'mal index", () => {
  it("seeds exactly the index the app bundles", async () => {
    const { AMAL } = await import("@alrisali/content/books");
    const migration = migrations.find(({ tag }) =>
      tag.endsWith("_amal_entries")
    );
    const insert = migration?.statements.find((statement) =>
      /^\s*INSERT\b/iu.test(statement)
    );
    const tuples = [
      ...(insert ?? "").matchAll(
        /\((?<month>\d+), (?<day>\d+), '(?<kind>\w+)', '(?<time>\w*)', '(?<id>[\w-]+)'\)/gu
      ),
    ].map(({ groups }) => ({
      month: Number(groups?.["month"]),
      day: Number(groups?.["day"]),
      kind: groups?.["kind"],
      time: groups?.["time"] || undefined,
      supplicationId: groups?.["id"],
    }));

    expect(tuples).toStrictEqual(
      AMAL.map((entry) => ({ ...entry, time: entry.time }))
    );
  });
});
