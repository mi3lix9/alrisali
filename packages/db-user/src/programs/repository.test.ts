import { SubscriptionRefusedError } from "@alrisali/domain/programs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { createPersonalProgramsRepository } from "./personal";
import { createSubscriptionsRepository } from "./repository";
import { programSubscriptions } from "./schema";

const NOW = new Date(500);

let directory: TemporaryDirectory;
let database: UserDatabase;
let clock = 1000;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const subscriptions = () =>
  createSubscriptionsRepository(database.db, () => {
    clock += 1;
    return new Date(clock);
  });

describe(createSubscriptionsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no Subscriptions at first", async () => {
    await expect(subscriptions().list()).resolves.toStrictEqual([]);
  });

  it("keeps Subscriptions, oldest first, across a relaunch", async () => {
    const repository = subscriptions();
    const nawafil = await repository.subscribe({
      id: "daily-nawafil",
      kind: "general",
    });
    const ramadan = await repository.subscribe({
      id: "ramadan",
      kind: "seasonal",
    });
    await database.close();
    database = await launch();

    await expect(subscriptions().list()).resolves.toStrictEqual([
      nawafil,
      ramadan,
    ]);
    expect(nawafil).toMatchObject({ programKind: "general", paused: false });
  });

  it("refuses a second General Program with a typed error and saves nothing", async () => {
    const repository = subscriptions();
    await repository.subscribe({ id: "daily-nawafil", kind: "general" });

    await expect(
      repository.subscribe({ id: "morning-adhkar", kind: "general" })
    ).rejects.toMatchObject({ reason: "maximum-general", limit: 1 });
    await expect(
      repository.subscribe({ id: "daily-nawafil", kind: "general" })
    ).rejects.toBeInstanceOf(SubscriptionRefusedError);
    await expect(repository.list()).resolves.toHaveLength(1);
  });

  it("refuses a second Seasonal Program and a sixth Subscription", async () => {
    const repository = subscriptions();
    await repository.subscribe({ id: "ramadan", kind: "seasonal" });
    await expect(
      repository.subscribe({ id: "muharram", kind: "seasonal" })
    ).rejects.toMatchObject({ reason: "maximum-seasonal" });

    await repository.subscribe({ id: "daily-nawafil", kind: "general" });
    const personal = createPersonalProgramsRepository(database.db);
    for (const id of ["mine-1", "mine-2", "mine-3", "mine-4"]) {
      // oxlint-disable-next-line no-await-in-loop -- one at a time, as a Believer would
      await personal.save({ id, name: id, description: "", acts: [] }, NOW);
    }
    for (const id of ["mine-1", "mine-2", "mine-3"]) {
      // oxlint-disable-next-line no-await-in-loop -- one at a time, as a Believer would
      await repository.subscribe({ id, kind: "personal" });
    }
    await expect(
      repository.subscribe({ id: "mine-4", kind: "personal" })
    ).rejects.toMatchObject({ reason: "maximum-programs", limit: 5 });
  });

  it("pauses and resumes a Subscription, which keeps its limit", async () => {
    const repository = subscriptions();
    await repository.subscribe({ id: "daily-nawafil", kind: "general" });

    await repository.pause("daily-nawafil");
    await expect(repository.list()).resolves.toMatchObject([
      { programId: "daily-nawafil", paused: true },
    ]);
    await expect(
      repository.subscribe({ id: "morning-adhkar", kind: "general" })
    ).rejects.toMatchObject({ reason: "maximum-general" });

    await repository.resume("daily-nawafil");
    await expect(repository.list()).resolves.toMatchObject([
      { programId: "daily-nawafil", paused: false },
    ]);
  });

  it("frees the limit when the Believer unsubscribes", async () => {
    const repository = subscriptions();
    await repository.subscribe({ id: "daily-nawafil", kind: "general" });
    await repository.unsubscribe("daily-nawafil");

    await expect(
      repository.subscribe({ id: "morning-adhkar", kind: "general" })
    ).resolves.toMatchObject({ programId: "morning-adhkar" });
  });

  it("skips a Subscription to a kind of Program this app does not know", async () => {
    await database.db.insert(programSubscriptions).values({
      id: "future",
      programKind: "shared",
      paused: false,
      subscribedAt: 1,
    });

    await expect(subscriptions().list()).resolves.toStrictEqual([]);
  });
});
