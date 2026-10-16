import { writtenAct } from "@alrisali/domain/programs";
import type { PersonalProgramInput } from "@alrisali/domain/programs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { createPersonalProgramsRepository } from "./personal";
import { createSubscriptionsRepository } from "./repository";
import { personalPrograms } from "./schema";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const programs = () => createPersonalProgramsRepository(database.db);
const subscriptions = () => createSubscriptionsRepository(database.db);

const witr = writtenAct({
  id: "witr",
  name: "Witr",
  schedule: { kind: "daily" },
  salah: { salah: "isha", timing: "after" },
});

const nights: PersonalProgramInput = {
  id: "nights",
  name: "My nights",
  description: "Before sleeping",
  acts: [witr],
};

describe(createPersonalProgramsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("keeps Personal Programs with their Acts, oldest first, across a relaunch", async () => {
    await programs().save(nights, new Date(2));
    await programs().save(
      { id: "fridays", name: "Fridays", description: "", acts: [] },
      new Date(3)
    );
    // Editing keeps its place.
    await programs().save({ ...nights, name: "Nights" }, new Date(4));
    await database.close();
    database = await launch();

    await expect(programs().list()).resolves.toStrictEqual([
      { ...nights, name: "Nights" },
      { id: "fridays", name: "Fridays", description: "", acts: [] },
    ]);
    await expect(programs().get("nights")).resolves.toMatchObject({
      acts: [witr],
    });
    await expect(programs().get("missing")).resolves.toBeNull();
  });

  it("refuses a Program without a name, saving nothing", async () => {
    await expect(
      programs().save({ ...nights, name: "  " }, new Date(1))
    ).rejects.toThrow(ZodError);
    await expect(programs().list()).resolves.toStrictEqual([]);
  });

  it("leaves out an Act this app cannot read", async () => {
    await database.db.insert(personalPrograms).values({
      id: "synced",
      name: "From a newer app",
      acts: JSON.stringify([
        witr,
        { ...witr, id: "future", detail: { type: "pilgrimage" } },
      ]),
      createdAt: new Date(1),
      updatedAt: new Date(1),
    });

    await expect(programs().get("synced")).resolves.toMatchObject({
      acts: [{ id: "witr" }],
    });
  });

  it("lets the Believer subscribe to their own Personal Program", async () => {
    await programs().save(nights, new Date(1));

    await expect(
      subscriptions().subscribe({ id: "nights", kind: "personal" })
    ).resolves.toMatchObject({ programId: "nights", programKind: "personal" });
  });

  it("refuses a Subscription to a Personal Program another Believer built", async () => {
    await expect(
      subscriptions().subscribe({ id: "someone-elses", kind: "personal" })
    ).rejects.toMatchObject({ reason: "not-creator" });
    await expect(subscriptions().list()).resolves.toStrictEqual([]);
  });

  it("deletes a Personal Program with its Subscription", async () => {
    await programs().save(nights, new Date(1));
    await subscriptions().subscribe({ id: "nights", kind: "personal" });

    await programs().remove("nights");

    await expect(programs().list()).resolves.toStrictEqual([]);
    await expect(subscriptions().list()).resolves.toStrictEqual([]);
  });
});
