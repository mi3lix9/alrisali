import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createReminderSettingsRepository } from "./repository";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const rule = (
  enabled: boolean,
  minutesBefore: number,
  atTime: "off" | "silent" | "takbir" | "adhan"
) => ({
  enabled,
  minutesBefore,
  sound: "default",
  muted: false,
  voice: false,
  atTime,
  adhanSound: "system",
});

/**
 * A new Believer: Fajr, Dhuhr and Maghrib remind before and play the takbir
 * at the time; Asr, Isha and Imsak's Reminder off; Imsak alerts in Ramadan.
 */
const NEW_BELIEVER = {
  salah: {
    fajr: rule(true, 5, "takbir"),
    dhuhr: rule(true, 5, "takbir"),
    asr: rule(false, 5, "off"),
    maghrib: rule(true, 5, "takbir"),
    isha: rule(false, 5, "off"),
  },
  imsak: { ...rule(false, 0, "silent"), ramadanOnly: true },
  quietHours: { enabled: false, start: 1380, end: 300 },
};

describe(createReminderSettingsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts with Fajr, Dhuhr and Maghrib reminding 5 minutes before", async () => {
    await expect(
      createReminderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual(NEW_BELIEVER);
  });

  it("keeps each change across a relaunch, leaving the rest", async () => {
    const reminders = createReminderSettingsRepository(database.db);
    await reminders.update({
      salah: {
        fajr: { voice: true, minutesBefore: 10 },
        isha: { enabled: true },
      },
    });
    await reminders.update({
      salah: { fajr: { sound: "bell" } },
      imsak: { enabled: true, muted: true },
      quietHours: { enabled: true, start: 1320 },
    });

    await database.close();
    database = await launch();

    await expect(
      createReminderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      salah: {
        ...NEW_BELIEVER.salah,
        fajr: { ...rule(true, 10, "takbir"), sound: "bell", voice: true },
        isha: rule(true, 5, "off"),
      },
      imsak: { ...NEW_BELIEVER.imsak, enabled: true, muted: true },
      quietHours: { enabled: true, start: 1320, end: 300 },
    });
  });

  it("rejects minutes before outside 0–60, an unknown sound or a time past midnight", async () => {
    const reminders = createReminderSettingsRepository(database.db);

    await expect(
      reminders.update({ salah: { fajr: { minutesBefore: 61 } } })
    ).rejects.toThrow("minutesBefore");
    await expect(
      // @ts-expect-error -- not a sound the app has
      reminders.update({ imsak: { sound: "siren" } })
    ).rejects.toThrow("sound");
    await expect(
      reminders.update({ quietHours: { end: 1440 } })
    ).rejects.toThrow("end");
    await expect(reminders.get()).resolves.toStrictEqual(NEW_BELIEVER);
  });

  it("keeps each Salah's At-Time Alert and Imsak's Ramadan choice", async () => {
    const reminders = createReminderSettingsRepository(database.db);
    await reminders.update({
      salah: { maghrib: { atTime: "adhan" }, asr: { atTime: "silent" } },
      imsak: { atTime: "takbir", ramadanOnly: false },
    });

    await database.close();
    database = await launch();

    await expect(
      createReminderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      ...NEW_BELIEVER,
      salah: {
        ...NEW_BELIEVER.salah,
        maghrib: rule(true, 5, "adhan"),
        asr: rule(false, 5, "silent"),
      },
      imsak: { ...rule(false, 0, "takbir"), ramadanOnly: false },
    });
  });

  it("refuses the full adhan for Imsak", async () => {
    const reminders = createReminderSettingsRepository(database.db);

    await expect(
      // @ts-expect-error -- Imsak has no full adhan
      reminders.update({ imsak: { atTime: "adhan" } })
    ).rejects.toThrow("atTime");
    await expect(reminders.get()).resolves.toStrictEqual(NEW_BELIEVER);
  });

  it("gives a rule saved before At-Time Alerts existed its default one", async () => {
    await database.db.run(
      sql`INSERT INTO reminder_settings (id, salah_rules) VALUES ('believer', '{"fajr":{"enabled":false,"minutesBefore":10}}')`
    );

    await expect(
      createReminderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      ...NEW_BELIEVER,
      salah: { ...NEW_BELIEVER.salah, fajr: rule(false, 10, "takbir") },
    });
  });

  it("reads values it does not know (written by a newer app) as the defaults", async () => {
    await createReminderSettingsRepository(database.db).update({
      salah: { asr: { enabled: true } },
    });
    await database.db.run(
      sql`UPDATE reminder_settings SET salah_rules = '{"asr":{"enabled":true,"sound":"future"},"duha":{}}', imsak_rule = 'not json', quiet_hours_start = 5000`
    );

    await expect(
      createReminderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      ...NEW_BELIEVER,
      salah: { ...NEW_BELIEVER.salah, asr: rule(true, 5, "off") },
    });
  });
});
