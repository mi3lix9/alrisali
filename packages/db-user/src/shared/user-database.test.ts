import { readdirSync } from "node:fs";

import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SyncedConnection } from "./connection";
import type { Migration } from "./migrate";
import { connectNode, temporaryDirectory } from "./testing";
import type { TemporaryDirectory } from "./testing";
import { openUserDatabase } from "./user-database";
import type { ConnectOptions, UserDatabase } from "./user-database";

const NOTES: Migration = {
  tag: "0001_notes",
  statements: [
    "CREATE TABLE `notes` (`id` text PRIMARY KEY, `body` text NOT NULL)",
  ],
};
const NOTES_PINNED: Migration = {
  tag: "0002_notes_pinned",
  statements: [
    "ALTER TABLE `notes` ADD `pinned` integer DEFAULT 0 NOT NULL",
    "CREATE INDEX `notes_pinned_idx` ON `notes` (`pinned`)",
  ],
};

let directory: TemporaryDirectory;
const opened: UserDatabase[] = [];

const open = async (
  migrations: readonly Migration[],
  overrides: {
    remoteUrl?: () => string | null;
    connect?: (options: ConnectOptions) => Promise<SyncedConnection>;
    onWrite?: () => void;
  } = {}
): Promise<UserDatabase> => {
  const database = await openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: overrides.remoteUrl ?? (() => null),
    connect: overrides.connect ?? connectNode,
    migrations,
    ...(overrides.onWrite ? { onWrite: overrides.onWrite } : {}),
  });
  opened.push(database);
  return database;
};

const close = async (database: UserDatabase): Promise<void> => {
  opened.splice(opened.indexOf(database), 1);
  await database.close();
};

const rows = (database: UserDatabase, query: SQL): Promise<unknown[][]> =>
  database.db.values(query);

const versionOf = async (database: UserDatabase): Promise<unknown> => {
  const [row] = await rows(
    database,
    sql`SELECT version FROM schema_version WHERE id = 1`
  );
  return row?.[0];
};

describe(openUserDatabase, () => {
  beforeEach(() => {
    directory = temporaryDirectory();
  });

  afterEach(async () => {
    await Promise.all(opened.splice(0).map((database) => database.close()));
    directory.remove();
    vi.restoreAllMocks();
  });

  describe("opening a Guest database", () => {
    it("opens in sync mode with no URL and no initial download", async () => {
      const seen: ConnectOptions[] = [];
      await open([], {
        connect: (options) => {
          seen.push(options);
          return connectNode(options);
        },
      });

      expect(seen).toHaveLength(1);
      expect(seen[0]?.url()).toBeNull();
      expect(seen[0]?.bootstrapIfEmpty).toBeFalsy();
    });

    it("keeps Guest rows and never touches the network when asked to sync", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const database = await open([NOTES]);

      await database.db.run(
        sql`INSERT INTO notes (id, body) VALUES ('n1', 'guest')`
      );
      const outcome = await database.sync();

      expect(outcome).toStrictEqual({ status: "paused" });
      expect(fetchSpy).not.toHaveBeenCalled();
      await expect(
        rows(database, sql`SELECT body FROM notes`)
      ).resolves.toStrictEqual([["guest"]]);
    });
  });

  describe("writing", () => {
    it("reports each write, but not reads or migrations, so sync can follow", async () => {
      const onWrite = vi.fn<() => void>();
      const database = await open([NOTES], { onWrite });
      expect(onWrite).not.toHaveBeenCalled();

      await database.db.run(
        sql`INSERT INTO notes (id, body) VALUES ('n1', 'first')`
      );
      await rows(database, sql`SELECT body FROM notes`);

      expect(onWrite).toHaveBeenCalledOnce();
    });
  });

  describe("signing out", () => {
    it("deletes the database from the device, so the next Believer starts empty", async () => {
      const believer = await open([NOTES]);
      await believer.db.run(
        sql`INSERT INTO notes (id, body) VALUES ('n1', 'private')`
      );
      opened.splice(opened.indexOf(believer), 1);

      await believer.wipe();

      expect(readdirSync(directory.path)).toStrictEqual([]);
      const next = await open([NOTES]);
      await expect(versionOf(next)).resolves.toBe(1);
      await expect(
        rows(next, sql`SELECT count(*) FROM notes`)
      ).resolves.toStrictEqual([[0]]);
    });
  });

  describe("bundled migrations", () => {
    it("run on open and record the schema version", async () => {
      const database = await open([NOTES]);

      await expect(versionOf(database)).resolves.toBe(1);
      await expect(
        rows(database, sql`SELECT count(*) FROM notes`)
      ).resolves.toStrictEqual([[0]]);
    });

    it("apply only the new ones on the next launch and keep existing rows", async () => {
      const first = await open([NOTES]);
      await first.db.run(
        sql`INSERT INTO notes (id, body) VALUES ('n1', 'kept')`
      );
      await close(first);

      const second = await open([NOTES, NOTES_PINNED]);

      await expect(versionOf(second)).resolves.toBe(2);
      await expect(
        rows(second, sql`SELECT id, body, pinned FROM notes`)
      ).resolves.toStrictEqual([["n1", "kept", 0]]);
    });

    it("accept tables and columns another device already pushed", async () => {
      const first = await open([NOTES, NOTES_PINNED]);
      await first.db.run(
        sql`INSERT INTO notes (id, body) VALUES ('n1', 'synced')`
      );
      // A pull can bring the tables while this row still says version 0.
      await first.db.run(
        sql`UPDATE schema_version SET version = 0 WHERE id = 1`
      );
      await close(first);

      const second = await open([NOTES, NOTES_PINNED]);

      await expect(versionOf(second)).resolves.toBe(2);
      await expect(
        rows(second, sql`SELECT id, body FROM notes`)
      ).resolves.toStrictEqual([["n1", "synced"]]);
    });

    it("leave a database written by a newer app at its version", async () => {
      const first = await open([NOTES, NOTES_PINNED]);
      await close(first);

      const second = await open([NOTES]);

      await expect(versionOf(second)).resolves.toBe(2);
    });

    it("roll back a migration that fails part-way", async () => {
      const broken: Migration = {
        tag: "0002_broken",
        statements: [
          "CREATE TABLE `drafts` (`id` text PRIMARY KEY)",
          "ALTER TABLE `missing` ADD `x` integer",
        ],
      };
      await close(await open([NOTES]));

      await expect(open([NOTES, broken])).rejects.toThrow("0002_broken");

      const after = await open([NOTES]);
      await expect(versionOf(after)).resolves.toBe(1);
      await expect(
        rows(after, sql`SELECT name FROM sqlite_schema WHERE name = 'drafts'`)
      ).resolves.toStrictEqual([]);
    });

    it("are all recorded before anything is pushed", async () => {
      const versionsAtPush: unknown[] = [];
      let remote: string | null = null;
      const database = await open([NOTES], {
        remoteUrl: () => remote,
        connect: async (options) => {
          const real = await connectNode(options);
          return {
            ...real,
            pull: () => Promise.resolve(false),
            push: async () => {
              const result = await real.query(
                "SELECT version FROM schema_version WHERE id = 1",
                []
              );
              versionsAtPush.push(result[0]?.[0]);
            },
          };
        },
      });

      remote = "http://127.0.0.1:1/db/believer";
      const outcome = await database.sync();

      expect(outcome).toStrictEqual({ status: "synced", pulledChanges: false });
      expect(versionsAtPush).toStrictEqual([1]);
    });
  });
});
