import {
  DEFAULT_QADA_PACE,
  DEFAULT_QADA_REMINDER,
  FutureQadaDateError,
  nextQadaSalahLog,
  qadaFastLog,
  remainingBacklog,
} from "@alrisali/domain/qada";
import type { QadaPlan } from "@alrisali/domain/qada";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createQadaRepository } from "./repository";

const TODAY = Temporal.PlainDate.from("2026-10-15");
const AT = new Date("2026-10-15T18:00:00.000Z");

const PLAN: QadaPlan = {
  backlog: {
    salah: { fajr: 30, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 },
    fasts: 10,
  },
  pace: DEFAULT_QADA_PACE,
  reminder: { enabled: true, at: 21 * 60, weekdays: [1, 2, 3, 4, 6, 7] },
};

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createQadaRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no Qada Plan or Qada Logs before setup", async () => {
    const qada = createQadaRepository(database.db);
    await expect(qada.plan()).resolves.toBeNull();
    await expect(qada.logs()).resolves.toStrictEqual([]);
  });

  it("keeps the plan across a relaunch, and an edit replaces it", async () => {
    await createQadaRepository(database.db).savePlan(PLAN, AT);
    await database.close();
    database = await launch();
    const qada = createQadaRepository(database.db);
    await expect(qada.plan()).resolves.toStrictEqual(PLAN);

    const edited = {
      ...PLAN,
      reminder: { ...DEFAULT_QADA_REMINDER },
      pace: { salahPerDay: 10, fastsPerWeek: 1 },
    };
    await qada.savePlan(edited, AT);
    await expect(qada.plan()).resolves.toStrictEqual(edited);
  });

  it("refuses a plan with a negative count", async () => {
    const qada = createQadaRepository(database.db);
    await expect(
      qada.savePlan({ ...PLAN, backlog: { ...PLAN.backlog, fasts: -1 } }, AT)
    ).rejects.toThrow(/expected number to be >=0/u);
    await expect(qada.plan()).resolves.toBeNull();
  });

  it("drops the backlog by each Qada Log, once however often it is logged", async () => {
    const qada = createQadaRepository(database.db);
    await qada.savePlan(PLAN, AT);
    const fajr = nextQadaSalahLog([], TODAY, "fajr");
    await qada.log(fajr, { today: TODAY, at: AT });
    // The Prayer Log logs the same Qada Fajr.
    await qada.log(nextQadaSalahLog([], TODAY, "fajr"), {
      today: TODAY,
      at: AT,
    });
    await qada.log(qadaFastLog(TODAY), { today: TODAY, at: AT });

    const logs = await qada.logs();
    expect(logs).toStrictEqual([fajr, qadaFastLog(TODAY)]);
    expect(remainingBacklog(PLAN.backlog, logs)).toStrictEqual({
      salah: { fajr: 29, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 },
      fasts: 9,
    });

    await qada.unlog(fajr.id);
    await expect(qada.logs()).resolves.toStrictEqual([qadaFastLog(TODAY)]);
  });

  it("refuses a Qada Log for a future date, saving nothing", async () => {
    const qada = createQadaRepository(database.db);
    await expect(
      qada.log(qadaFastLog(TODAY.add({ days: 1 })), { today: TODAY, at: AT })
    ).rejects.toBeInstanceOf(FutureQadaDateError);
    await expect(qada.logs()).resolves.toStrictEqual([]);
  });
});
