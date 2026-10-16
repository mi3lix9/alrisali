// The Last-Read Ayah follows a Believer to a second device, against a local
// `tursodb --sync-server` standing in for Turso Cloud.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { UserDatabase } from "../shared";
import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "../shared/testing";
import type { SyncServer, TemporaryDirectory } from "../shared/testing";
import { createQuranLastReadRepository } from "./last-read";

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;
let cloudCount = 0;
const opened: UserDatabase[] = [];

/** A phone and a tablet signed in to the same fresh cloud database. */
const openPhoneAndTablet = async () => {
  cloudCount += 1;
  const cloudName = `quran-${cloudCount}`;
  const [phone, tablet] = await Promise.all(
    ["phone", "tablet"].map((device) =>
      openSignedInDevice({
        server,
        directory,
        cloudName,
        device: `${device}-${cloudCount}`,
      })
    )
  );
  if (!phone || !tablet) {
    throw new Error("The devices did not open");
  }
  opened.push(phone, tablet);
  return { phone, tablet };
};

describe("Last-Read Ayah sync", () => {
  beforeAll(async () => {
    serverDirectory = temporaryDirectory();
    directory = temporaryDirectory();
    server = await startSyncServer({ directory: serverDirectory.path });
  });

  afterEach(async () => {
    await Promise.all(opened.splice(0).map((database) => database.close()));
  });

  afterAll(async () => {
    await server.stop();
    serverDirectory.remove();
    directory.remove();
  });

  it("brings the Last-Read Ayah to a second device", async () => {
    const { phone, tablet } = await openPhoneAndTablet();
    await createQuranLastReadRepository(phone.db).set("18:10");
    await phone.sync();
    await tablet.sync();

    await expect(
      createQuranLastReadRepository(tablet.db).get()
    ).resolves.toMatchObject({ ayah: "18:10" });
  });

  it("resumes both devices at the most recent Last-Read Ayah", async () => {
    const { phone, tablet } = await openPhoneAndTablet();
    await createQuranLastReadRepository(phone.db).set("2:255");
    await phone.sync();
    await tablet.sync();

    await createQuranLastReadRepository(tablet.db).set("36:1");
    await tablet.sync();
    await phone.sync();

    await expect(
      Promise.all(
        [phone, tablet].map((device) =>
          createQuranLastReadRepository(device.db).get()
        )
      )
    ).resolves.toMatchObject([{ ayah: "36:1" }, { ayah: "36:1" }]);
  });
});
