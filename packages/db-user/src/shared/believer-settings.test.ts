import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createBelieverSettingsRepository } from "./believer-settings";
import { connectNode, temporaryDirectory } from "./testing";
import type { TemporaryDirectory } from "./testing";
import { openUserDatabase } from "./user-database";
import type { UserDatabase } from "./user-database";

const NAJAF = { latitude: 32.0259, longitude: 44.3462, name: "النجف" };

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

/** Closes the database and opens it again, as an app relaunch does. */
const relaunch = async (): Promise<void> => {
  await database.close();
  database = await launch();
};

describe(createBelieverSettingsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts with the Ja'fari method, no location and no Hijri Adjustment", async () => {
    const settings = createBelieverSettingsRepository(database.db);

    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "jafari",
      location: null,
      hijriAdjustment: 0,
    });
  });

  it("keeps the settings across a relaunch", async () => {
    await createBelieverSettingsRepository(database.db).update({
      calculationMethod: "hanafi",
      location: NAJAF,
      hijriAdjustment: -1,
    });

    await relaunch();

    await expect(
      createBelieverSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      calculationMethod: "hanafi",
      location: NAJAF,
      hijriAdjustment: -1,
    });
  });

  it("changes one setting without touching the others", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({
      calculationMethod: "ibadi",
      location: NAJAF,
      hijriAdjustment: 2,
    });

    await settings.update({ calculationMethod: "sunni" });
    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "sunni",
      location: NAJAF,
      hijriAdjustment: 2,
    });

    await settings.update({ location: null });
    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "sunni",
      location: null,
      hijriAdjustment: 2,
    });

    await settings.update({ hijriAdjustment: 0 });
    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "sunni",
      location: null,
      hijriAdjustment: 0,
    });
  });

  it("returns the settings it saved", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    const unnamed = { ...NAJAF, name: null };

    await expect(settings.update({ location: unnamed })).resolves.toStrictEqual(
      { calculationMethod: "jafari", location: unnamed, hijriAdjustment: 0 }
    );
  });

  it("rejects a Hijri Adjustment beyond two days and keeps the saved one", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ hijriAdjustment: 1 });

    await expect(settings.update({ hijriAdjustment: 3 })).rejects.toThrow(
      "hijriAdjustment"
    );
    await expect(settings.update({ hijriAdjustment: -3 })).rejects.toThrow(
      "hijriAdjustment"
    );

    const { hijriAdjustment } = await settings.get();
    expect(hijriAdjustment).toBe(1);
  });

  it("rejects a location off the globe and keeps the saved one", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ location: NAJAF });

    await expect(
      settings.update({ location: { latitude: 91, longitude: 0, name: null } })
    ).rejects.toThrow("latitude");
    await expect(
      settings.update({
        location: { latitude: 0, longitude: -181, name: null },
      })
    ).rejects.toThrow("longitude");

    const { location } = await settings.get();
    expect(location).toStrictEqual(NAJAF);
  });

  it("reads a method it does not know (written by a newer app) as the default", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ location: NAJAF });
    await database.db.run(
      sql`UPDATE believer_settings SET calculation_method = 'future-method'`
    );

    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "jafari",
      location: NAJAF,
      hijriAdjustment: 0,
    });
  });
});
