import type { Lesson } from "@alrisali/domain/lessons";
import { describe, expect, it } from "vitest";

import {
  addUploadingSlides,
  emptyLessonForm,
  failSlideUpload,
  finishSlideUpload,
  lessonToForm,
  publishBlocked,
  validateLessonForm,
} from "./lesson-form";
import type { LessonForm } from "./lesson-form";

const KEY_1 = "slide/00000000-0000-4000-8000-000000000001.png";
const KEY_2 = "slide/00000000-0000-4000-8000-000000000002.jpg";
const KEY_3 = "slide/00000000-0000-4000-8000-000000000003.webp";

const tawheed: Lesson = {
  id: "tawheed",
  title: { ar: "التوحيد", en: "Tawheed" },
  description: { ar: "أصل الدين", en: "" },
  category: "aqeedah",
  published: true,
  slides: [
    { id: "s1", imageKey: KEY_1, caption: { ar: "الأولى", en: "First" } },
    { id: "s2", imageKey: KEY_2, caption: { ar: "", en: "" } },
  ],
};

describe("saving a Lesson's form", () => {
  it("saves an edited Lesson with the ids of its Slides kept", () => {
    expect(validateLessonForm(lessonToForm(tawheed))).toStrictEqual({
      ok: true,
      draft: tawheed,
    });
  });

  it("saves a new Lesson and its new Slides without ids", () => {
    let form: LessonForm = {
      ...emptyLessonForm(),
      titleAr: " الوضوء ",
      category: "fiqh",
    };
    form = addUploadingSlides(form, ["local-a"]);
    form = finishSlideUpload(form, "local-a", KEY_3);

    expect(validateLessonForm(form)).toStrictEqual({
      ok: true,
      draft: {
        title: { ar: "الوضوء", en: "" },
        description: { ar: "", en: "" },
        category: "fiqh",
        published: false,
        slides: [{ imageKey: KEY_3, caption: { ar: "", en: "" } }],
      },
    });
  });

  it("asks for the Arabic title", () => {
    const result = validateLessonForm({ ...emptyLessonForm(), titleAr: "  " });
    expect(result).toMatchObject({
      ok: false,
      errors: { titleAr: "Required" },
    });
  });

  it("refuses publishing a Lesson with no Slides, but saves it as a draft", () => {
    const form = { ...emptyLessonForm(), titleAr: "الصبر" };
    expect(publishBlocked({ ...form, published: true })).toBeTruthy();
    expect(validateLessonForm({ ...form, published: true })).toMatchObject({
      ok: false,
      errors: { slides: "A published Lesson needs at least one Slide" },
    });
    expect(publishBlocked(form)).toBeFalsy();
    expect(validateLessonForm(form)).toMatchObject({ ok: true });
  });

  it("waits for Slides still uploading, and refuses ones that failed", () => {
    const uploading = addUploadingSlides(lessonToForm(tawheed), [
      "local-a",
      "local-b",
    ]);
    expect(validateLessonForm(uploading)).toStrictEqual({
      ok: false,
      errors: { slides: "Wait for 2 Slide images to finish uploading." },
    });

    const failed = failSlideUpload(
      finishSlideUpload(uploading, "local-a", KEY_3),
      "local-b",
      "too big"
    );
    expect(validateLessonForm(failed)).toStrictEqual({
      ok: false,
      errors: { slides: "Remove the Slide whose image failed to upload." },
    });
  });
});

describe(addUploadingSlides, () => {
  it("adds Slides after the existing ones, uploading", () => {
    const form = addUploadingSlides(lessonToForm(tawheed), ["local-a"]);
    expect(form.slides.map((slide) => slide.imageKey)).toStrictEqual([
      KEY_1,
      KEY_2,
      null,
    ]);
    expect(form.slides[2]).toMatchObject({
      localId: "local-a",
      id: null,
      upload: { status: "uploading" },
    });
  });

  it("records an upload's key or its error on that Slide only", () => {
    const form = addUploadingSlides(emptyLessonForm(), ["a", "b"]);
    const done = failSlideUpload(finishSlideUpload(form, "a", KEY_1), "b", "x");
    expect(
      done.slides.map(({ imageKey, upload }) => ({ imageKey, upload }))
    ).toStrictEqual([
      { imageKey: KEY_1, upload: null },
      { imageKey: null, upload: { status: "failed", error: "x" } },
    ]);
  });

  it("ignores an upload finishing for a Slide already removed", () => {
    const form = emptyLessonForm();
    expect(finishSlideUpload(form, "gone", KEY_1)).toStrictEqual(form);
  });
});
