// Favourite ayat follow a Believer to a second device, against a local
// `tursodb --sync-server` standing in for Turso Cloud.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "../shared/testing";
import type { SyncServer, TemporaryDirectory } from "../shared/testing";
import { createFavoritesRepository } from "./repository";

const AYAT_AL_KURSI = { kind: "ayah", key: "2:255" } as const;

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;

describe("favourite ayat sync", () => {
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

  it("brings a favourite ayah, and its removal, to a second device", async () => {
    const [phone, tablet] = await Promise.all(
      ["phone", "tablet"].map((device) =>
        openSignedInDevice({ server, directory, cloudName: "ayat", device })
      )
    );
    if (!phone || !tablet) {
      throw new Error("The devices did not open");
    }
    try {
      await createFavoritesRepository(phone.db).add(AYAT_AL_KURSI);
      await phone.sync();
      await tablet.sync();
      await expect(
        createFavoritesRepository(tablet.db).list()
      ).resolves.toMatchObject([AYAT_AL_KURSI]);

      await createFavoritesRepository(tablet.db).remove(AYAT_AL_KURSI);
      await tablet.sync();
      await phone.sync();
      await expect(
        createFavoritesRepository(phone.db).has(AYAT_AL_KURSI)
      ).resolves.toBeFalsy();
    } finally {
      await Promise.all([phone.close(), tablet.close()]);
    }
  });
});
