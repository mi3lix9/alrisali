import {
  lessonFieldsSchema,
  lessonSchema,
  slideSchema,
  withSlidesWhenPublished,
} from "@alrisali/domain/lessons";
import { oc } from "@orpc/contract";
import { z } from "zod";

const byId = z.object({ id: z.string().trim().min(1) });

/** A Slide as an Admin edits it: a new one has no id yet. */
export const slideDraftSchema = slideSchema.extend({
  id: z.string().min(1).optional(),
});

export type SlideDraft = z.infer<typeof slideDraftSchema>;

/** A Lesson as an Admin edits it: a new one and its new Slides have no ids. */
export const lessonDraftSchema = withSlidesWhenPublished(
  lessonFieldsSchema.extend({
    id: z.string().min(1).optional(),
    slides: z.array(slideDraftSchema),
  })
);

export type LessonDraft = z.infer<typeof lessonDraftSchema>;

/**
 * Lessons and their Slides, published in the content database: devices read
 * them from their replica after the next pull. Admins only. Slide images are
 * uploaded first (`createUpload`, purpose `slide`).
 */
export const lessonsContract = {
  /** Every Lesson, drafts too, in the Admins' order. */
  list: oc.output(z.array(lessonSchema)),
  /** One Lesson with its Slides; null when there is none. */
  get: oc.input(byId).output(lessonSchema.nullable()),
  /**
   * Creates or replaces a Lesson with its Slides, in their given order. A
   * new Lesson goes last. BAD_REQUEST for an image not uploaded as a `slide`.
   */
  save: oc.input(lessonDraftSchema).output(lessonSchema),
  /** Deletes a Lesson and its Slides. */
  remove: oc.input(byId).output(byId),
  /** Orders the Lessons as listed. */
  reorder: oc
    .input(z.object({ ids: z.array(z.string().trim().min(1)) }))
    .output(z.object({})),
};
