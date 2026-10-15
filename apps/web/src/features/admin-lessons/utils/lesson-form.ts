import { lessonDraftSchema } from "@alrisali/api/lessons";
import type { LessonDraft } from "@alrisali/api/lessons";
import type { Lesson, LessonCategory } from "@alrisali/domain/lessons";

/** Field errors by form field, such as `titleAr` or `slides`. */
export type FieldErrors = Record<string, string>;

export type Validated<T> =
  | { ok: true; draft: T }
  | { ok: false; errors: FieldErrors };

/** Where a Slide's image upload stands; null once its key is known. */
export type SlideUpload =
  | { status: "uploading" }
  | { status: "failed"; error: string }
  | null;

/** A Slide as the form holds it. */
export interface SlideForm {
  /** Identifies the Slide in the form, before the server gives it an id. */
  localId: string;
  /** The saved Slide's id; null for a new one. */
  id: string | null;
  /** Null until its image has uploaded. */
  imageKey: string | null;
  upload: SlideUpload;
  captionAr: string;
  captionEn: string;
}

/** A Lesson as its form holds it: every input's text. */
export interface LessonForm {
  id: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: LessonCategory;
  published: boolean;
  /** In the order Believers swipe through them. */
  slides: SlideForm[];
}

export const emptyLessonForm = (): LessonForm => ({
  id: null,
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  category: "aqeedah",
  published: false,
  slides: [],
});

export const lessonToForm = (lesson: Lesson): LessonForm => ({
  id: lesson.id,
  titleAr: lesson.title.ar,
  titleEn: lesson.title.en,
  descriptionAr: lesson.description.ar,
  descriptionEn: lesson.description.en,
  category: lesson.category,
  published: lesson.published,
  slides: lesson.slides.map((slide) => ({
    localId: slide.id,
    id: slide.id,
    imageKey: slide.imageKey,
    upload: null,
    captionAr: slide.caption.ar,
    captionEn: slide.caption.en,
  })),
});

/** Adds a Slide per id in `localIds` after the others, its image uploading. */
export const addUploadingSlides = (
  form: LessonForm,
  localIds: readonly string[]
): LessonForm => ({
  ...form,
  slides: [
    ...form.slides,
    ...localIds.map((localId) => ({
      localId,
      id: null,
      imageKey: null,
      upload: { status: "uploading" } as const,
      captionAr: "",
      captionEn: "",
    })),
  ],
});

const updateSlide = (
  form: LessonForm,
  localId: string,
  changes: Partial<SlideForm>
): LessonForm =>
  form.slides.some((slide) => slide.localId === localId)
    ? {
        ...form,
        slides: form.slides.map((slide) =>
          slide.localId === localId ? { ...slide, ...changes } : slide
        ),
      }
    : form;

/** The Slide's image uploaded as `imageKey`. */
export const finishSlideUpload = (
  form: LessonForm,
  localId: string,
  imageKey: string
): LessonForm => updateSlide(form, localId, { imageKey, upload: null });

/** The Slide's image could not upload. */
export const failSlideUpload = (
  form: LessonForm,
  localId: string,
  error: string
): LessonForm =>
  updateSlide(form, localId, { upload: { status: "failed", error } });

/** Publishing needs at least one Slide; a draft may have none. */
export const publishBlocked = (form: LessonForm): boolean =>
  form.published && form.slides.length === 0;

/** Draft paths whose form field has another name. */
const FORM_FIELDS: Record<string, string> = {
  "title.ar": "titleAr",
  "title.en": "titleEn",
  "description.ar": "descriptionAr",
  "description.en": "descriptionEn",
};

const pendingUploadsError = (slides: readonly SlideForm[]): string | null => {
  const uploading = slides.filter(
    (slide) => slide.upload?.status === "uploading"
  ).length;
  if (uploading > 0) {
    return uploading === 1
      ? "Wait for 1 Slide image to finish uploading."
      : `Wait for ${uploading} Slide images to finish uploading.`;
  }
  if (slides.some((slide) => slide.upload?.status === "failed")) {
    return "Remove the Slide whose image failed to upload.";
  }
  return null;
};

/** The form as the contract's draft, or the errors to show by its fields. */
export const validateLessonForm = (
  form: LessonForm
): Validated<LessonDraft> => {
  const pending = pendingUploadsError(form.slides);
  if (pending) {
    return { ok: false, errors: { slides: pending } };
  }
  const result = lessonDraftSchema.safeParse({
    ...(form.id === null ? {} : { id: form.id }),
    title: { ar: form.titleAr, en: form.titleEn },
    description: { ar: form.descriptionAr, en: form.descriptionEn },
    category: form.category,
    published: form.published,
    slides: form.slides.map((slide) => ({
      ...(slide.id === null ? {} : { id: slide.id }),
      imageKey: slide.imageKey,
      caption: { ar: slide.captionAr, en: slide.captionEn },
    })),
  });
  if (result.success) {
    return { ok: true, draft: result.data };
  }
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    errors[FORM_FIELDS[path] ?? path] ??=
      issue.code === "too_small" && issue.origin === "string"
        ? "Required"
        : issue.message;
  }
  return { ok: false, errors };
};
