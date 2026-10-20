// A Believer's place in a Supplication follows them to a second device,
// against a local `tursodb --sync-server` standing in for Turso Cloud.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "../shared/testing";
import type { SyncServer, TemporaryDirectory } from "../shared/testing";
import { createSupplicationPositionsRepository } from "./positions";

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;

describe("supplication position sync", () => {
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

  it("continues on a second device at the section reached on the first", async () => {
    const [phone, tablet] = await Promise.all(
      ["phone", "tablet"].map((device) =>
        openSignedInDevice({ server, directory, cloudName: "duas", device })
      )
    );
    if (!phone || !tablet) {
      throw new Error("The devices did not open");
    }
    try {
      await createSupplicationPositionsRepository(phone.db).save("kumayl", 40);
      await phone.sync();
      await tablet.sync();
      await expect(
        createSupplicationPositionsRepository(tablet.db).position("kumayl")
      ).resolves.toMatchObject({ section: 40 });

      await createSupplicationPositionsRepository(tablet.db).save("kumayl", 75);
      await tablet.sync();
      await phone.sync();
      await expect(
        createSupplicationPositionsRepository(phone.db).position("kumayl")
      ).resolves.toMatchObject({ section: 75 });
    } finally {
      await Promise.all([phone.close(), tablet.close()]);
    }
  });
});
