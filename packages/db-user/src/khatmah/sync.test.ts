// A Khatmah and its logs follow a Believer to a second device and stay
// theirs, against a local `tursodb --sync-server` standing in for Turso Cloud.
import { Temporal } from "temporal-polyfill";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "../shared/testing";
import type { SyncServer, TemporaryDirectory } from "../shared/testing";
import { createKhatmahRepository } from "./repository";

const START = Temporal.PlainDate.from("2026-10-15");
const AT = new Date("2026-10-15T18:00:00.000Z");
const ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;

describe("khatmah sync", () => {
  beforeAll(async () => {
    serverDirectory = temporaryDirectory();
    directory = temporaryDirectory();
    server = await startSyncServer({ directory: serverDirectory.path });
  });

  afterAll(async () => {
    await server.stop();
    serverDirectory.remove();
    directory.remove();
  });

  it("brings the Khatmah and a completed session to the Believer's second device, and no one else's", async () => {
    const [phone, tablet, stranger] = await Promise.all(
      [
        ["phone", "khatmah"],
        ["tablet", "khatmah"],
        ["stranger", "someone-else"],
      ].map(([device, cloudName]) =>
        openSignedInDevice({
          server,
          directory,
          cloudName: cloudName ?? "",
          device: device ?? "",
        })
      )
    );
    if (!phone || !tablet || !stranger) {
      throw new Error("The devices did not open");
    }
    try {
      const onPhone = createKhatmahRepository(phone.db);
      await onPhone.create(
        ID,
        { plan: { kind: "suggested" }, startDate: START, reminderAt: 300 },
        AT
      );
      await onPhone.log({ khatmahId: ID, session: 1, date: START }, AT);
      await phone.sync();
      await tablet.sync();
      await stranger.sync();

      const onTablet = createKhatmahRepository(tablet.db);
      await expect(onTablet.list()).resolves.toMatchObject([
        { id: ID, plan: { kind: "suggested" }, reminderAt: 300 },
      ]);
      await expect(onTablet.logs()).resolves.toStrictEqual([
        { khatmahId: ID, session: 1, date: START },
      ]);

      const onStranger = createKhatmahRepository(stranger.db);
      await expect(onStranger.list()).resolves.toStrictEqual([]);
      await expect(onStranger.logs()).resolves.toStrictEqual([]);
    } finally {
      await Promise.all([phone.close(), tablet.close(), stranger.close()]);
    }
  });

  it("merges the same session completed on both devices into one log", async () => {
    const [phone, tablet] = await Promise.all(
      ["phone", "tablet"].map((device) =>
        openSignedInDevice({
          server,
          directory,
          cloudName: "khatmah-twice",
          device: `${device}-twice`,
        })
      )
    );
    if (!phone || !tablet) {
      throw new Error("The devices did not open");
    }
    try {
      const onPhone = createKhatmahRepository(phone.db);
      await onPhone.create(
        ID,
        { plan: { kind: "suggested" }, startDate: START, reminderAt: null },
        AT
      );
      await phone.sync();
      await tablet.sync();
      const log = { khatmahId: ID, session: 1, date: START };
      await onPhone.log(log, AT);
      await createKhatmahRepository(tablet.db).log(log, AT);
      await phone.sync();
      await tablet.sync();
      await phone.sync();

      await expect(onPhone.logs()).resolves.toStrictEqual([log]);
      await expect(
        createKhatmahRepository(tablet.db).logs()
      ).resolves.toStrictEqual([log]);
    } finally {
      await Promise.all([phone.close(), tablet.close()]);
    }
  });
});
