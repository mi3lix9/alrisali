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
  hijriAdjustment: 0,
  messageStyle: "classic",
  customAngles: { fajr: 18, maghrib: 4, isha: 14 },
  prayerAdjustments: {},
  midnightDefinition: "sunsetToFajr",
  highLatitudeRule: "angleBased",
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
      hijriAdjustment: -1,
      messageStyle: "modern",
      customAngles: { fajr: 15.5, maghrib: 0, isha: 12 },
      prayerAdjustments: { fajr: -3, isha: 5 },
      midnightDefinition: "maghribToSunrise",
      highLatitudeRule: "oneSeventh",
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
      hijriAdjustment: -1,
      messageStyle: "modern",
      customAngles: { fajr: 15.5, maghrib: 0, isha: 12 },
      prayerAdjustments: { fajr: -3, isha: 5 },
      midnightDefinition: "maghribToSunrise",
      highLatitudeRule: "oneSeventh",
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

    await settings.update({ hijriAdjustment: 2 });
    await settings.update({ hijriAdjustment: 0 });
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

  it("rejects Custom angles outside their ranges and keeps the saved ones", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    const saved = { fajr: 17, maghrib: 3, isha: 15 };
    await settings.update({ calculationMethod: "custom", customAngles: saved });

    const outOfRange = [
      { ...saved, fajr: 9 },
      { ...saved, fajr: 26 },
      { ...saved, maghrib: -1 },
      { ...saved, maghrib: 11 },
      { ...saved, isha: 9 },
      { ...saved, isha: 26 },
    ];
    await Promise.all(
      outOfRange.map((angles) =>
        expect(settings.update({ customAngles: angles })).rejects.toThrow(
          "customAngles"
        )
      )
    );
    await expect(settings.get()).resolves.toMatchObject({
      calculationMethod: "custom",
      customAngles: saved,
    });
  });

  it("rejects an adjustment beyond 30 minutes and keeps the saved ones", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ prayerAdjustments: { maghrib: 2 } });

    await expect(
      settings.update({ prayerAdjustments: { maghrib: 31 } })
    ).rejects.toThrow("prayerAdjustments");
    await expect(
      settings.update({ prayerAdjustments: { fajr: -30.5 } })
    ).rejects.toThrow("prayerAdjustments");
    await expect(settings.get()).resolves.toMatchObject({
      prayerAdjustments: { maghrib: 2 },
    });
  });

  it("clears an adjustment set back to zero", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ prayerAdjustments: { fajr: 4, isha: 2 } });

    await expect(
      settings.update({ prayerAdjustments: { fajr: 0, isha: 2 } })
    ).resolves.toMatchObject({ prayerAdjustments: { isha: 2 } });
  });

  it("reads adjustments, a Midnight definition or a rule it does not know as the defaults", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ calculationMethod: "egypt" });
    await database.db.run(
      sql`UPDATE believer_settings SET prayer_adjustments = 'not json', midnight_definition = 'noon', high_latitude_rule = 'sixths'`
    );

    await expect(settings.get()).resolves.toMatchObject({
      prayerAdjustments: {},
      midnightDefinition: "sunsetToFajr",
      highLatitudeRule: "angleBased",
    });
  });

  it("reads unreadable Custom angles as the defaults", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ calculationMethod: "egypt" });
    await database.db.run(
      sql`UPDATE believer_settings SET custom_angles = '{"fajr":99}'`
    );
    await expect(settings.get()).resolves.toMatchObject(DEFAULTS);
    await database.db.run(
      sql`UPDATE believer_settings SET custom_angles = 'not json'`
    );
    await expect(settings.get()).resolves.toMatchObject(DEFAULTS);
  });

  it("reads values it does not know (written by a newer app) as the defaults", async () => {
    const settings = createBelieverSettingsRepository(database.db);
    await settings.update({ location: NAJAF, timeFormat: "12h" });
    await database.db.run(
      sql`UPDATE believer_settings SET calculation_method = 'future-method', time_format = 'swatch', imsak_minutes = 600, message_style = 'shouty'`
    );

    await expect(settings.get()).resolves.toStrictEqual({
      calculationMethod: "jafari",
      location: NAJAF,
      ...DEFAULTS,
    });
  });
});
