import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createQuranRibbonsRepository } from "./ribbons";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const colour = async (name: string) => {
  const ribbons = await createQuranRibbonsRepository(database.db).list();
  return ribbons.find((ribbon) => ribbon.color === name);
};

describe(createQuranRibbonsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("lists exactly six unused ribbons before any is set", async () => {
    const ribbons = await createQuranRibbonsRepository(database.db).list();

    expect(ribbons).toHaveLength(6);
    expect(ribbons.every((ribbon) => ribbon.ayah === null)).toBeTruthy();
  });

  it("moves a ribbon to the next ayah it is set on", async () => {
    const repository = createQuranRibbonsRepository(database.db);
    await repository.move("red", "2:255");
    await repository.move("red", "112:1");

    const ribbons = await repository.list();
    expect(ribbons).toHaveLength(6);
    expect(ribbons.filter((ribbon) => ribbon.ayah !== null)).toHaveLength(1);
    await expect(colour("red")).resolves.toMatchObject({ ayah: "112:1" });
  });

  it("keeps a name across a move, a clear and a relaunch", async () => {
    const repository = createQuranRibbonsRepository(database.db);
    await repository.rename("green", "  Dua  ");
    await repository.move("green", "1:1");
    await repository.clear("green");

    await database.close();
    database = await launch();

    await expect(colour("green")).resolves.toMatchObject({
      name: "Dua",
      ayah: null,
    });
  });

  it("restores the default name when renamed blank", async () => {
    const repository = createQuranRibbonsRepository(database.db);
    await repository.rename("blue", "Hifz");
    await repository.rename("blue", " ");

    await expect(colour("blue")).resolves.toMatchObject({ name: null });
  });

  it("refuses an ayah the mushaf does not have", async () => {
    await expect(
      createQuranRibbonsRepository(database.db).move("red", "115:1")
    ).rejects.toThrow("No ayah 115:1");
  });
});
