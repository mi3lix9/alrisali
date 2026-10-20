// The Home shortcut layout follows a Believer to a second device, against a
// local `tursodb --sync-server` standing in for Turso Cloud.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createShellPreferencesRepository } from "./shell-preferences";
import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "./testing";
import type { SyncServer, TemporaryDirectory } from "./testing";

const LAYOUT = {
  order: ["tasbih", "qibla", "quran"],
  hidden: ["quran"],
} as const;

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;

describe("home shortcut sync", () => {
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

  it("brings the Believer's shortcut order to a second device", async () => {
    const [phone, tablet] = await Promise.all(
      ["phone", "tablet"].map((device) =>
        openSignedInDevice({
          server,
          directory,
          cloudName: "shortcuts",
          device,
        })
      )
    );
    if (!phone || !tablet) {
      throw new Error("The devices did not open");
    }
    try {
      await createShellPreferencesRepository(phone.db).update({
        homeShortcuts: { order: [...LAYOUT.order], hidden: [...LAYOUT.hidden] },
      });
      await phone.sync();
      await tablet.sync();

      await expect(
        createShellPreferencesRepository(tablet.db).get()
      ).resolves.toMatchObject({ homeShortcuts: LAYOUT });
    } finally {
      await Promise.all([phone.close(), tablet.close()]);
    }
  });
});
