// Guest → Believer against a local `tursodb --sync-server`, the stand-in for
// the Believer's Turso Cloud database (same sync protocol, no auth).
import path from "node:path";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createBelieverSettingsRepository } from "./believer-settings";
import { connectNode, startSyncServer, temporaryDirectory } from "./testing";
import type { SyncServer, TemporaryDirectory } from "./testing";
import { openUserDatabase } from "./user-database";
import type { UserDatabase } from "./user-database";

const NAJAF = { latitude: 32, longitude: 44.33, name: "Najaf" };
const KARBALA = { latitude: 32.62, longitude: 44.02, name: "Karbala" };
const MASHHAD = { latitude: 36.3, longitude: 59.6, name: "Mashhad" };

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let devices: TemporaryDirectory;
let cloudName: string;
let databaseCount = 0;
const opened: UserDatabase[] = [];

/** One device's database file; `signedIn` is flipped by sign-in. */
const openDevice = async (
  device: string,
  access: { signedIn: boolean; tokenRequests?: number }
): Promise<UserDatabase> => {
  const database = await openUserDatabase({
    path: path.join(devices.path, `${device}.db`),
    remoteUrl: () => (access.signedIn ? server.databaseUrl(cloudName) : null),
    authToken: () => {
      access.tokenRequests = (access.tokenRequests ?? 0) + 1;
      return Promise.resolve(`token-for-${cloudName}`);
    },
    connect: connectNode,
  });
  opened.push(database);
  return database;
};

const cloudSettings = () =>
  server.query(
    cloudName,
    "SELECT id, calculation_method, location_name FROM believer_settings"
  );

describe("Guest → Believer sync", () => {
  beforeAll(async () => {
    serverDirectory = temporaryDirectory();
    server = await startSyncServer({ directory: serverDirectory.path });
  });

  beforeEach(() => {
    devices = temporaryDirectory();
    databaseCount += 1;
    cloudName = `believer-${databaseCount}`;
  });

  afterEach(async () => {
    await Promise.all(opened.splice(0).map((database) => database.close()));
    devices.remove();
  });

  afterAll(async () => {
    await server.stop();
    serverDirectory.remove();
  });

  it("pushes what a Guest recorded, tables included, into a fresh cloud database on sign-in", async () => {
    const access = { signedIn: false };
    const phone = await openDevice("phone", access);
    await createBelieverSettingsRepository(phone.db).update({
      calculationMethod: "ibadi",
      location: NAJAF,
    });
    await expect(phone.sync()).resolves.toStrictEqual({ status: "paused" });

    access.signedIn = true;
    await expect(phone.sync()).resolves.toMatchObject({ status: "synced" });

    await expect(cloudSettings()).resolves.toStrictEqual([
      ["believer", "ibadi", "Najaf"],
    ]);
    await expect(
      server.query(cloudName, "SELECT version FROM schema_version")
    ).resolves.toStrictEqual([[phone.schemaVersion]]);
  });

  it("asks for a database token only once signed in", async () => {
    const access = { signedIn: false, tokenRequests: 0 };
    const phone = await openDevice("phone", access);
    await createBelieverSettingsRepository(phone.db).update({
      location: NAJAF,
    });
    await phone.sync();
    expect(access.tokenRequests).toBe(0);

    access.signedIn = true;
    await phone.sync();
    expect(access.tokenRequests).toBeGreaterThan(0);
  });

  it("brings a Believer's records to a second device that signs in", async () => {
    const phone = await openDevice("phone", { signedIn: true });
    await createBelieverSettingsRepository(phone.db).update({
      location: KARBALA,
    });
    await phone.sync();

    // The new device opens like any Guest, migrated, then signs in.
    const tabletAccess = { signedIn: false };
    const tablet = await openDevice("tablet", tabletAccess);
    tabletAccess.signedIn = true;
    await expect(tablet.sync()).resolves.toStrictEqual({
      status: "synced",
      pulledChanges: true,
    });

    await expect(
      createBelieverSettingsRepository(tablet.db).get()
    ).resolves.toStrictEqual({
      calculationMethod: "jafari",
      location: KARBALA,
    });
  });

  it("resolves the same row edited on two devices to the last push", async () => {
    const phone = await openDevice("phone", { signedIn: true });
    const tablet = await openDevice("tablet", { signedIn: true });
    const onPhone = createBelieverSettingsRepository(phone.db);
    const onTablet = createBelieverSettingsRepository(tablet.db);
    await onPhone.update({ location: NAJAF });
    await phone.sync();
    await tablet.sync();

    await onPhone.update({ location: KARBALA });
    await onTablet.update({ location: MASHHAD });
    await phone.sync();
    await tablet.sync();
    await phone.sync();

    const mashhad = { calculationMethod: "jafari", location: MASHHAD };
    await expect(onPhone.get()).resolves.toStrictEqual(mashhad);
    await expect(onTablet.get()).resolves.toStrictEqual(mashhad);
    await expect(cloudSettings()).resolves.toStrictEqual([
      ["believer", "jafari", "Mashhad"],
    ]);
  });
});
