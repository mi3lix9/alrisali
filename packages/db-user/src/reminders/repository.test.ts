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

const rule = (enabled: boolean, minutesBefore = 5) => ({
  enabled,
  minutesBefore,
  sound: "default",
  muted: false,
  voice: false,
  adhan: "hatamzadeh-takbeer",
});

/** A new Believer: Fajr, Dhuhr and Maghrib on; Asr, Isha and Imsak off. */
const NEW_BELIEVER = {
  salah: {
    fajr: rule(true),
    dhuhr: rule(true),
    asr: rule(false),
    maghrib: rule(true),
    isha: rule(false),
  },
  imsak: rule(false, 0),
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
        fajr: { ...rule(true, 10), sound: "bell", voice: true },
        isha: rule(true),
      },
      imsak: { ...rule(true, 0), muted: true },
      quietHours: { enabled: true, start: 1320, end: 300 },
    });
  });

  it("keeps every change when updates run at the same time", async () => {
    const first = createReminderSettingsRepository(database.db);
    const second = createReminderSettingsRepository(database.db);

    await Promise.all([
      first.update({ salah: { dhuhr: { enabled: false } } }),
      second.update({ salah: { maghrib: { enabled: false } } }),
      first.update({ salah: { fajr: { enabled: false } } }),
    ]);

    const { salah } = await first.get();
    expect([
      salah.fajr.enabled,
      salah.dhuhr.enabled,
      salah.maghrib.enabled,
    ]).toStrictEqual([false, false, false]);
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
      salah: { ...NEW_BELIEVER.salah, asr: rule(true) },
    });
  });
});
