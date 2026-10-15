import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createLessonProgressRepository } from "./repository";

let directory: TemporaryDirectory;
let database: UserDatabase;
let clock = 1_760_000_000_000;
const now = () => clock;

/** A Guest's database: no cloud URL, so it never syncs. */
const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createLessonProgressRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
    clock = 1_760_000_000_000;
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("keeps a Guest's place in a Lesson across a relaunch", async () => {
    const lessons = createLessonProgressRepository(database.db, now);
    await lessons.viewSlide({ lessonId: "tawheed", slide: 0, slideCount: 5 });
    await lessons.viewSlide({ lessonId: "tawheed", slide: 2, slideCount: 5 });
    await lessons.viewSlide({ lessonId: "tawheed", slide: 1, slideCount: 5 });

    await database.close();
    database = await launch();

    await expect(
      createLessonProgressRepository(database.db, now).get("tawheed")
    ).resolves.toStrictEqual({
      lessonId: "tawheed",
      currentSlide: 1,
      furthestSlide: 2,
      completedAt: null,
      updatedAt: clock,
    });
  });

  it("records completion at the last Slide, and says so only once", async () => {
    const lessons = createLessonProgressRepository(database.db, now);

    const first = await lessons.viewSlide({
      lessonId: "tawheed",
      slide: 4,
      slideCount: 5,
    });
    clock += 1000;
    const again = await lessons.viewSlide({
      lessonId: "tawheed",
      slide: 4,
      slideCount: 5,
    });

    expect(first.completed).toBeTruthy();
    expect(again.completed).toBeFalsy();
    await expect(lessons.get("tawheed")).resolves.toMatchObject({
      completedAt: 1_760_000_000_000,
    });
  });

  it("records completion when the Believer marks it complete", async () => {
    const lessons = createLessonProgressRepository(database.db, now);
    await lessons.viewSlide({ lessonId: "wudu", slide: 1, slideCount: 6 });

    await expect(lessons.markComplete("wudu")).resolves.toMatchObject({
      completed: true,
      progress: { currentSlide: 1, completedAt: clock },
    });
    await expect(lessons.markComplete("wudu")).resolves.toMatchObject({
      completed: false,
    });
  });

  it("lists every Lesson's progress", async () => {
    const lessons = createLessonProgressRepository(database.db, now);
    await lessons.viewSlide({ lessonId: "wudu", slide: 0, slideCount: 3 });
    await lessons.markComplete("tawheed");

    await expect(lessons.all()).resolves.toMatchObject([
      { lessonId: "tawheed", completedAt: clock },
      { lessonId: "wudu", completedAt: null },
    ]);
  });

  it("has no progress for a Lesson never opened", async () => {
    await expect(
      createLessonProgressRepository(database.db, now).get("history")
    ).resolves.toBeNull();
  });

  it("refuses a Slide the Lesson does not have", async () => {
    await expect(
      createLessonProgressRepository(database.db, now).viewSlide({
        lessonId: "tawheed",
        slide: 5,
        slideCount: 5,
      })
    ).rejects.toThrow(RangeError);
  });
});
