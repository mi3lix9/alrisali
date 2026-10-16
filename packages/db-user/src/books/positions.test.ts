import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createSupplicationPositionsRepository } from "./positions";

let directory: TemporaryDirectory;
let database: UserDatabase;

/** A Guest's database: no cloud URL, so it never syncs. */
const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const yesterday = new Date("2026-10-15T21:40:00Z");

describe(createSupplicationPositionsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no position for a Supplication never read", async () => {
    await expect(
      createSupplicationPositionsRepository(database.db).position("kumayl")
    ).resolves.toBeNull();
  });

  it("keeps each Supplication's latest section across a relaunch", async () => {
    const positions = createSupplicationPositionsRepository(
      database.db,
      () => yesterday
    );
    await positions.save("kumayl", 12);
    await positions.save("sabah", 3);
    await positions.save("kumayl", 40);

    await database.close();
    database = await launch();
    const relaunched = createSupplicationPositionsRepository(database.db);

    await expect(relaunched.position("kumayl")).resolves.toStrictEqual({
      section: 40,
      savedAt: yesterday,
    });
    await expect(relaunched.position("sabah")).resolves.toMatchObject({
      section: 3,
    });
  });

  it("refuses a section that is not a passage of a text", async () => {
    const positions = createSupplicationPositionsRepository(database.db);

    await expect(positions.save("kumayl", -1)).rejects.toThrow(/too small/iu);
    await expect(positions.save("kumayl", 2.5)).rejects.toThrow(/int/iu);
    await expect(positions.position("kumayl")).resolves.toBeNull();
  });
});
