import { randomUUID } from "node:crypto";

import { createLessonsRepository } from "@alrisali/db-content/lessons";
import type { Lesson } from "@alrisali/domain/lessons";
import { ORPCError } from "@orpc/server";

import type { Context } from "@/context";
import { admin } from "@/shared/lib/orpc";
import { isUploadFor } from "@/shared/lib/uploads";

const lessonsOf = async ({ content }: Pick<Context, "content">) =>
  createLessonsRepository(await content.db());

const list = admin.lessons.list.handler(async ({ context }) => {
  const lessons = await lessonsOf(context);
  return lessons.list({ includeUnpublished: true });
});

const get = admin.lessons.get.handler(async ({ context, input: { id } }) => {
  const lessons = await lessonsOf(context);
  return lessons.get(id);
});

/**
 * Devices show the change after their next pull. A Slide keeps its id only
 * when it already belongs to this Lesson (devices may hold on to it); any
 * other id, or a repeated one, is replaced, so a Lesson never takes another
 * Lesson's Slide.
 */
const save = admin.lessons.save.handler(async ({ context, input }) => {
  const misplaced = input.slides.find(
    ({ imageKey }) => !isUploadFor("slide", imageKey)
  );
  if (misplaced) {
    throw new ORPCError("BAD_REQUEST", {
      message: `${misplaced.imageKey} was not uploaded as a slide`,
    });
  }
  const lessons = await lessonsOf(context);
  const id = input.id ?? randomUUID();
  const existing = input.id ? await lessons.get(input.id) : null;
  const own = new Set(existing?.slides.map((slide) => slide.id));
  const lesson: Lesson = {
    ...input,
    id,
    slides: input.slides.map((slide) => ({
      ...slide,
      id:
        slide.id !== undefined && own.delete(slide.id)
          ? slide.id
          : randomUUID(),
    })),
  };
  await lessons.save(lesson);
  return lesson;
});

const remove = admin.lessons.remove.handler(
  async ({ context, input: { id } }) => {
    const lessons = await lessonsOf(context);
    await lessons.remove(id);
    return { id };
  }
);

const reorder = admin.lessons.reorder.handler(
  async ({ context, input: { ids } }) => {
    const lessons = await lessonsOf(context);
    await lessons.reorder(ids);
    return {};
  }
);

export const lessonsRouter = { list, get, save, remove, reorder };
