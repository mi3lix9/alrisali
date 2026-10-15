// Personal Programs follow a Believer to a second device, against a local
// `tursodb --sync-server` standing in for Turso Cloud.
import { writtenAct } from "@alrisali/domain/programs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "../shared/testing";
import type { SyncServer, TemporaryDirectory } from "../shared/testing";
import { createPersonalProgramsRepository } from "./personal";
import { createSubscriptionsRepository } from "./repository";

const witr = writtenAct({
  id: "witr",
  name: "Witr",
  schedule: { kind: "daily" },
  salah: { salah: "isha", timing: "after" },
});

const nights = {
  id: "nights",
  name: "My nights",
  description: "",
  acts: [witr],
};

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;

describe("Personal Program sync", () => {
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

  it("brings a Personal Program, its Subscription, edits and deletion to a second device", async () => {
    const [phone, tablet] = await Promise.all(
      ["phone", "tablet"].map((device) =>
        openSignedInDevice({
          server,
          directory,
          cloudName: "personal",
          device,
        })
      )
    );
    if (!phone || !tablet) {
      throw new Error("The devices did not open");
    }
    try {
      await createPersonalProgramsRepository(phone.db).save(
        nights,
        new Date(1)
      );
      await createSubscriptionsRepository(phone.db).subscribe({
        id: "nights",
        kind: "personal",
      });
      await phone.sync();
      await tablet.sync();

      const onTablet = createPersonalProgramsRepository(tablet.db);
      await expect(onTablet.list()).resolves.toStrictEqual([nights]);
      await expect(
        createSubscriptionsRepository(tablet.db).list()
      ).resolves.toMatchObject([
        { programId: "nights", programKind: "personal", paused: false },
      ]);

      const edited = {
        ...nights,
        acts: [witr, writtenAct({ ...witr, id: "dua", name: "Dua" })],
      };
      await onTablet.save(edited, new Date(2));
      await tablet.sync();
      await phone.sync();
      await expect(
        createPersonalProgramsRepository(phone.db).get("nights")
      ).resolves.toStrictEqual(edited);

      await createPersonalProgramsRepository(phone.db).remove("nights");
      await phone.sync();
      await tablet.sync();
      await expect(onTablet.list()).resolves.toStrictEqual([]);
      await expect(
        createSubscriptionsRepository(tablet.db).list()
      ).resolves.toStrictEqual([]);
    } finally {
      await Promise.all([phone.close(), tablet.close()]);
    }
  });
});
