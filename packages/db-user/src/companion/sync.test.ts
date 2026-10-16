// Companion XP follows a Believer across devices without double awards,
// against a local `tursodb --sync-server` standing in for Turso Cloud.
import { XP_FOR } from "@alrisali/domain/companion";
import type { XpEvent } from "@alrisali/domain/companion";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "../shared/testing";
import type { SyncServer, TemporaryDirectory } from "../shared/testing";
import { createCompanionRepository } from "./repository";

const FAJR: XpEvent = { kind: "salah", date: "2026-10-16", salah: "fajr" };
const LESSON: XpEvent = { kind: "lesson", lessonId: "aqeedah-1" };

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;

describe("Companion XP sync", () => {
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

  it("counts an event awarded on two devices once, and keeps each device's own awards", async () => {
    const [phone, tablet] = await Promise.all(
      ["phone", "tablet"].map((device) =>
        openSignedInDevice({ server, directory, cloudName: "xp", device })
      )
    );
    if (!phone || !tablet) {
      throw new Error("The devices did not open");
    }
    try {
      // Fajr logged on both devices before either synced; the Lesson on one.
      await createCompanionRepository(phone.db).award(FAJR);
      await createCompanionRepository(tablet.db).award(FAJR);
      await createCompanionRepository(tablet.db).award(LESSON);

      await phone.sync();
      await tablet.sync();
      await phone.sync();

      const expected = XP_FOR.salah + XP_FOR.lesson;
      for (const device of [phone, tablet]) {
        // oxlint-disable-next-line no-await-in-loop -- one device at a time
        await expect(
          createCompanionRepository(device.db).companion()
        ).resolves.toMatchObject({ xp: expected });
      }
      // The synced award stops a replay on the other device too.
      await expect(
        createCompanionRepository(phone.db).award(LESSON)
      ).resolves.toMatchObject({ awarded: false, after: expected });
    } finally {
      await Promise.all([phone.close(), tablet.close()]);
    }
  });
});
