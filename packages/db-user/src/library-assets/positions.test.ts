import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createLibraryAssetPositionsRepository } from "./positions";

let directory: TemporaryDirectory;
let database: UserDatabase;

/** A Guest's database: no cloud URL, so it never syncs. */
const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createLibraryAssetPositionsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no position for a Library Asset never opened", async () => {
    await expect(
      createLibraryAssetPositionsRepository(database.db).position("asset-1")
    ).resolves.toBeNull();
  });

  it("keeps each Library Asset's latest position across a relaunch", async () => {
    const positions = createLibraryAssetPositionsRepository(database.db);
    await positions.save("pdf", 12);
    await positions.save("lecture", 95.5);
    await positions.save("pdf", 14);

    await database.close();
    database = await launch();
    const relaunched = createLibraryAssetPositionsRepository(database.db);

    await expect(relaunched.position("pdf")).resolves.toBe(14);
    await expect(relaunched.position("lecture")).resolves.toBe(95.5);
  });

  it("refuses a position that is not a place in a file", async () => {
    const positions = createLibraryAssetPositionsRepository(database.db);

    await expect(positions.save("pdf", -1)).rejects.toThrow(/too small/iu);
    await expect(positions.save("pdf", Number.NaN)).rejects.toThrow(
      /expected number/u
    );
    await expect(positions.position("pdf")).resolves.toBeNull();
  });
});
