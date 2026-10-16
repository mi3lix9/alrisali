import { describe, expect, it } from "vitest";

import { createContentDb } from "../shared/content-db";
import type { Transaction } from "../shared/content-db";
import { createWorshipMappingRepository } from "./worship-repository";

const setup = () => {
  const executed: string[] = [];
  const transactions: string[][] = [];
  const transaction: Transaction = (statements) => {
    transactions.push(statements.map(({ sql }) => sql));
    return Promise.resolve();
  };
  const db = createContentDb((sql) => {
    executed.push(sql);
    return Promise.resolve([]);
  }, transaction);
  return {
    executed,
    transactions,
    repository: createWorshipMappingRepository(db),
  };
};

describe("worship mapping replace", () => {
  it("deletes and inserts in one transaction", async () => {
    const { executed, transactions, repository } = setup();

    await repository.replace("night-dua", "thursday", ["a", "b", "a"]);

    expect(executed).toStrictEqual([]);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toHaveLength(2);
    expect(transactions[0]?.[0]).toMatch(/^delete/iu);
    expect(transactions[0]?.[1]).toMatch(/^insert/iu);
  });

  it("clears a day in one transaction when nothing is listed", async () => {
    const { transactions, repository } = setup();

    await repository.replace("ziyarah", "friday", []);

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toHaveLength(1);
  });
});
