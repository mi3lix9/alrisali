import { lessonSchema, slideSchema } from "@alrisali/domain/lessons";
import type { Lesson, Slide } from "@alrisali/domain/lessons";
import { asc, eq, max } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { isMissingTable } from "../shared/content-db";
import type { ContentDb } from "../shared/content-db";
import { lessonSlides, lessons } from "./schema";

type LessonRow = typeof lessons.$inferSelect;
type SlideRow = typeof lessonSlides.$inferSelect;

export interface ListLessonsOptions {
  /** Admins see drafts too; devices only published Lessons. */
  includeUnpublished?: boolean;
}

export interface LessonsRepository {
  /**
   * Lessons with their Slides, in the Admins' order. Empty while a device's
   * replica has never pulled. A row this app cannot read (a newer category,
   * say) is left out rather than failing the list.
   */
  list: (options?: ListLessonsOptions) => Promise<Lesson[]>;
  /** One Lesson with its Slides; null when there is none. */
  get: (id: string) => Promise<Lesson | null>;
  /**
   * Publishes a Lesson and its Slides as given, in one transaction (the
   * server only; replicas refuse). A new Lesson goes last in the order.
   */
  save: (lesson: Lesson) => Promise<void>;
  /** Deletes a Lesson and its Slides; nothing happens for an unknown id. */
  remove: (id: string) => Promise<void>;
  /** Puts Lessons in the order of `ids` (the Admins send every one). */
  reorder: (ids: readonly string[]) => Promise<void>;
}

const slideFromRow = (row: SlideRow): Slide | null => {
  const parsed = slideSchema.safeParse({
    id: row.id,
    imageKey: row.imageKey,
    caption: { ar: row.captionAr, en: row.captionEn },
  });
  return parsed.success ? parsed.data : null;
};

const lessonFromRow = (
  row: LessonRow,
  slides: readonly SlideRow[]
): Lesson | null => {
  const parsed = lessonSchema.safeParse({
    id: row.id,
    title: { ar: row.titleAr, en: row.titleEn },
    description: { ar: row.descriptionAr, en: row.descriptionEn },
    category: row.category,
    published: row.published,
    slides: slides.map(slideFromRow).filter((slide) => slide !== null),
  });
  return parsed.success ? parsed.data : null;
};

/** Lessons with their own Slides; nothing on a replica that has never pulled. */
const read = async (
  lessonRows: PromiseLike<LessonRow[]>,
  slideRows: PromiseLike<SlideRow[]>
): Promise<Lesson[]> => {
  try {
    const [rows, slides] = await Promise.all([lessonRows, slideRows]);
    return rows
      .map((row) =>
        lessonFromRow(
          row,
          slides.filter(({ lessonId }) => lessonId === row.id)
        )
      )
      .filter((lesson) => lesson !== null);
  } catch (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw error;
  }
};

type Batch = [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]];

export const createLessonsRepository = (db: ContentDb): LessonsRepository => ({
  list: ({ includeUnpublished = false } = {}) =>
    read(
      db
        .select()
        .from(lessons)
        .where(includeUnpublished ? undefined : eq(lessons.published, true))
        .orderBy(asc(lessons.position), asc(lessons.id)),
      db
        .select()
        .from(lessonSlides)
        .orderBy(asc(lessonSlides.position), asc(lessonSlides.id))
    ),
  get: async (id) => {
    const [lesson] = await read(
      db.select().from(lessons).where(eq(lessons.id, id)),
      db
        .select()
        .from(lessonSlides)
        .where(eq(lessonSlides.lessonId, id))
        .orderBy(asc(lessonSlides.position), asc(lessonSlides.id))
    );
    return lesson ?? null;
  },
  save: async (lesson) => {
    const [last] = await db
      .select({ position: max(lessons.position) })
      .from(lessons);
    const values = {
      titleAr: lesson.title.ar,
      titleEn: lesson.title.en,
      descriptionAr: lesson.description.ar,
      descriptionEn: lesson.description.en,
      category: lesson.category,
      published: lesson.published,
    };
    const statements: Batch = [
      db
        .insert(lessons)
        .values({
          id: lesson.id,
          position: (last?.position ?? -1) + 1,
          ...values,
        })
        .onConflictDoUpdate({ target: lessons.id, set: values }),
      db.delete(lessonSlides).where(eq(lessonSlides.lessonId, lesson.id)),
    ];
    if (lesson.slides.length > 0) {
      statements.push(
        db.insert(lessonSlides).values(
          lesson.slides.map((slide, position) => ({
            id: slide.id,
            lessonId: lesson.id,
            position,
            imageKey: slide.imageKey,
            captionAr: slide.caption.ar,
            captionEn: slide.caption.en,
          }))
        )
      );
    }
    await db.batch(statements);
  },
  remove: async (id) => {
    await db.batch([
      db.delete(lessonSlides).where(eq(lessonSlides.lessonId, id)),
      db.delete(lessons).where(eq(lessons.id, id)),
    ]);
  },
  reorder: async (ids) => {
    const [first, ...rest] = ids.map((id, position) =>
      db.update(lessons).set({ position }).where(eq(lessons.id, id))
    );
    if (first) {
      await db.batch([first, ...rest]);
    }
  },
});
