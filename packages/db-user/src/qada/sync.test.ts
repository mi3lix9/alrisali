// The Qada Backlog follows a Believer to a second device and stays theirs,
// against a local `tursodb --sync-server` standing in for Turso Cloud.
import {
  DEFAULT_QADA_PACE,
  DEFAULT_QADA_REMINDER,
  nextQadaSalahLog,
  remainingBacklog,
} from "@alrisali/domain/qada";
import type { QadaPlan } from "@alrisali/domain/qada";
import { Temporal } from "temporal-polyfill";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  openSignedInDevice,
  startSyncServer,
  temporaryDirectory,
} from "../shared/testing";
import type { SyncServer, TemporaryDirectory } from "../shared/testing";
import { createQadaRepository } from "./repository";

const TODAY = Temporal.PlainDate.from("2026-10-15");
const AT = new Date("2026-10-15T18:00:00.000Z");

const PLAN: QadaPlan = {
  backlog: {
    salah: { fajr: 30, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 },
    fasts: 0,
  },
  pace: DEFAULT_QADA_PACE,
  reminder: DEFAULT_QADA_REMINDER,
};

let server: SyncServer;
let serverDirectory: TemporaryDirectory;
let directory: TemporaryDirectory;

describe("qada backlog sync", () => {
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

  it("brings the backlog and a Qada Salah to the Believer's second device, and no one else's", async () => {
    const [phone, tablet, stranger] = await Promise.all(
      [
        ["phone", "qada"],
        ["tablet", "qada"],
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
      const onPhone = createQadaRepository(phone.db);
      await onPhone.savePlan(PLAN, AT);
      await onPhone.log(nextQadaSalahLog([], TODAY, "fajr"), {
        today: TODAY,
        at: AT,
      });
      await phone.sync();
      await tablet.sync();
      await stranger.sync();

      const onTablet = createQadaRepository(tablet.db);
      await expect(onTablet.plan()).resolves.toStrictEqual(PLAN);
      const logs = await onTablet.logs();
      expect(remainingBacklog(PLAN.backlog, logs).salah.fajr).toBe(29);

      const onStranger = createQadaRepository(stranger.db);
      await expect(onStranger.plan()).resolves.toBeNull();
      await expect(onStranger.logs()).resolves.toStrictEqual([]);
    } finally {
      await Promise.all([phone.close(), tablet.close(), stranger.close()]);
    }
  });
});
