import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createFavoritesRepository } from "./repository";

const KUMAYL = { kind: "supplication", key: "mafatih-dua-kumayl" } as const;
const AYAT_AL_KURSI = { kind: "ayah", key: "2:255" } as const;
const AL_KAHF = { kind: "surah", key: "18" } as const;
const ASSET = { kind: "library-asset", key: "asset-1" } as const;

let directory: TemporaryDirectory;
let database: UserDatabase;

/** A Guest's database: no cloud URL, so it never syncs. */
const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

/** A clock that moves one minute on every reading. */
const ticking = () => {
  let minute = 0;
  return () => {
    minute += 1;
    return new Date(Date.UTC(2026, 9, 15, 12, minute));
  };
};

describe(createFavoritesRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts with no Favorites", async () => {
    const favorites = createFavoritesRepository(database.db);

    await expect(favorites.list()).resolves.toStrictEqual([]);
    await expect(favorites.has(KUMAYL)).resolves.toBeFalsy();
  });

  it("keeps a Guest's Favorites of every kind across a relaunch, newest first", async () => {
    const favorites = createFavoritesRepository(database.db, ticking());
    await favorites.add(AL_KAHF);
    await favorites.add(KUMAYL);
    await favorites.add(ASSET);
    await favorites.add(AYAT_AL_KURSI);

    await database.close();
    database = await launch();

    await expect(
      createFavoritesRepository(database.db).list()
    ).resolves.toStrictEqual([
      { ...AYAT_AL_KURSI, favoritedAt: "2026-10-15T12:04:00.000Z" },
      { ...ASSET, favoritedAt: "2026-10-15T12:03:00.000Z" },
      { ...KUMAYL, favoritedAt: "2026-10-15T12:02:00.000Z" },
      { ...AL_KAHF, favoritedAt: "2026-10-15T12:01:00.000Z" },
    ]);
    await expect(
      createFavoritesRepository(database.db).has(KUMAYL)
    ).resolves.toBeTruthy();
  });

  it("keeps one Favorite, and its first date, when an item is favourited twice", async () => {
    const favorites = createFavoritesRepository(database.db, ticking());
    await favorites.add(KUMAYL);
    await favorites.add(KUMAYL);

    await expect(favorites.list()).resolves.toStrictEqual([
      { ...KUMAYL, favoritedAt: "2026-10-15T12:01:00.000Z" },
    ]);
  });

  it("tells kinds apart when keys match", async () => {
    const favorites = createFavoritesRepository(database.db);
    await favorites.add({ kind: "supplication", key: "18" });

    await expect(favorites.has(AL_KAHF)).resolves.toBeFalsy();
  });

  it("removes a Favorite and leaves the others", async () => {
    const favorites = createFavoritesRepository(database.db, ticking());
    await favorites.add(KUMAYL);
    await favorites.add(AL_KAHF);

    await favorites.remove(KUMAYL);
    await favorites.remove(KUMAYL);

    await expect(favorites.has(KUMAYL)).resolves.toBeFalsy();
    await expect(favorites.list()).resolves.toStrictEqual([
      { ...AL_KAHF, favoritedAt: "2026-10-15T12:02:00.000Z" },
    ]);
  });

  it("rejects an item that names nothing", async () => {
    const favorites = createFavoritesRepository(database.db);

    await expect(favorites.add({ kind: "surah", key: "115" })).rejects.toThrow(
      "Surah"
    );
    await expect(favorites.list()).resolves.toStrictEqual([]);
  });

  it("removes several Favorites at once and leaves the others", async () => {
    const favorites = createFavoritesRepository(database.db, ticking());
    await favorites.add(KUMAYL);
    await favorites.add(AL_KAHF);
    await favorites.add(AYAT_AL_KURSI);

    await favorites.removeMany([KUMAYL, AYAT_AL_KURSI]);

    await expect(favorites.list()).resolves.toStrictEqual([
      { ...AL_KAHF, favoritedAt: "2026-10-15T12:02:00.000Z" },
    ]);
  });

  it("removes nothing when given nothing, or items that are not Favorites", async () => {
    const favorites = createFavoritesRepository(database.db, ticking());
    await favorites.add(KUMAYL);

    await favorites.removeMany([]);
    await favorites.removeMany([AL_KAHF]);

    await expect(favorites.list()).resolves.toMatchObject([KUMAYL]);
  });

  it("skips Favorites of a kind a newer app added", async () => {
    const favorites = createFavoritesRepository(database.db);
    await favorites.add(KUMAYL);
    await database.db.run(
      sql`INSERT INTO favorites (id, kind, key, favorited_at)
          VALUES ('lesson:1', 'lesson', '1', '2026-10-16T00:00:00.000Z')`
    );

    await expect(favorites.list()).resolves.toMatchObject([KUMAYL]);
  });
});
