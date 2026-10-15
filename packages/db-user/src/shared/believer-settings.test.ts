import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createBelieverSettingsRepository } from "./believer-settings";
import { connectNode, temporaryDirectory } from "./testing";
import type { TemporaryDirectory } from "./testing";
import { openUserDatabase } from "./user-database";
import type { UserDatabase } from "./user-database";

const NAJAF = { latitude: 32.0259, longitude: 44.3462, name: "النجف" };

/** The settings a new Believer starts with, besides method and location. */
const DEFAULTS = {
  locationFollowsDevice: true,
  imsakMinutes: 10,
  timeFormat: null,
};

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

  it("starts with the Ja'fari method and no location", async () => {
    const settings = createBelieverSettingsRepository(database.db);

    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "jafari",
      location: null,
      ...DEFAULTS,
    });
  });

  it("keeps every setting across a relaunch", async () => {
    await createBelieverSettingsRepository(database.db).update({
      calculationMethod: "hanafi",
      location: NAJAF,
      locationFollowsDevice: false,
      imsakMinutes: 15,
      timeFormat: "12h",
    });

    await relaunch();

    await expect(
      createBelieverSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      calculationMethod: "hanafi",
      location: NAJAF,
      locationFollowsDevice: false,
      imsakMinutes: 15,
      timeFormat: "12h",
    });
  });

  it("changes one setting without touching the other", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ calculationMethod: "ibadi", location: NAJAF });

    await settings.update({ calculationMethod: "sunni" });
    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "sunni",
      location: NAJAF,
      ...DEFAULTS,
    });

    await settings.update({ location: null });
    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "sunni",
      location: null,
      ...DEFAULTS,
    });

    await settings.update({ timeFormat: "24h" });
    await settings.update({ timeFormat: null, imsakMinutes: 0 });
    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "sunni",
      location: null,
      ...DEFAULTS,
      imsakMinutes: 0,
    });
  });

  it("returns the settings it saved", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    const unnamed = { ...NAJAF, name: null };

    await expect(settings.update({ location: unnamed })).resolves.toStrictEqual(
      { calculationMethod: "jafari", location: unnamed, ...DEFAULTS }
    );
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

  it("rejects Imsak minutes outside 0–60 or fractional", async () => {
    const settings = createBelieverSettingsRepository(database.db);

    await expect(settings.update({ imsakMinutes: -1 })).rejects.toThrow(
      "imsakMinutes"
    );
    await expect(settings.update({ imsakMinutes: 61 })).rejects.toThrow(
      "imsakMinutes"
    );
    await expect(settings.update({ imsakMinutes: 2.5 })).rejects.toThrow(
      "imsakMinutes"
    );
    await expect(settings.get()).resolves.toMatchObject({ imsakMinutes: 10 });
  });

  it("reads values it does not know (written by a newer app) as the defaults", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ location: NAJAF, timeFormat: "12h" });
    await database.db.run(
      sql`UPDATE believer_settings SET calculation_method = 'future-method', time_format = 'swatch', imsak_minutes = 600`
    );

    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "jafari",
      location: NAJAF,
      ...DEFAULTS,
    });
  });
});
