import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createBelieverSettingsRepository } from "./believer-settings";
import { connectNode, temporaryDirectory } from "./testing";
import type { TemporaryDirectory } from "./testing";
import { openUserDatabase } from "./user-database";
import type { UserDatabase, UserDb } from "./user-database";
import {
  countUserRecords,
  listUserTables,
  readUserTables,
} from "./user-tables";

// shared/ never imports a feature, so records go in as the feature would
// store them.
const favorite = (db: UserDb, key: string) =>
  db.run(
    sql`insert into favorites (id, kind, key, favorited_at) values (${`ayah:${key}`}, 'ayah', ${key}, '2026-10-15T12:00:00.000Z')`
  );

describe("user tables", () => {
  let directory: TemporaryDirectory;
  let database: UserDatabase;

  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await openUserDatabase({
      path: `${directory.path}/believer.db`,
      remoteUrl: () => null,
      connect: connectNode,
    });
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  describe(listUserTables, () => {
    it("lists the features' tables and none of the sync or migration bookkeeping", async () => {
      const tables = await listUserTables(database.db);

      expect(tables).toContain("favorites");
      expect(tables).toContain("dhikr_sessions");
      expect(tables).toContain("believer_settings");
      expect(tables).not.toContain("schema_version");
      expect(
        tables.filter((name) => /^(?:sqlite_|turso_|__)/u.test(name))
      ).toStrictEqual([]);
    });
  });

  describe(readUserTables, () => {
    it("reads every row of every table with its column names", async () => {
      await favorite(database.db, "2:255");

      const tables = await readUserTables(database.db);

      expect(tables.map((table) => table.name)).toStrictEqual(
        await listUserTables(database.db)
      );
      expect(tables.find((table) => table.name === "favorites")).toStrictEqual({
        name: "favorites",
        columns: ["id", "kind", "key", "favorited_at"],
        rows: [["ayah:2:255", "ayah", "2:255", "2026-10-15T12:00:00.000Z"]],
      });
    });
  });

  describe(countUserRecords, () => {
    it("starts at zero on a fresh Guest database", async () => {
      await expect(countUserRecords(database.db)).resolves.toBe(0);
    });

    it("counts what the Believer recorded, not their preferences", async () => {
      await favorite(database.db, "2:255");
      await favorite(database.db, "18:10");
      await createBelieverSettingsRepository(database.db).update({
        hijriAdjustment: 1,
      });

      await expect(countUserRecords(database.db)).resolves.toBe(2);
    });
  });
});
