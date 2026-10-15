import { LESSON_CATEGORIES } from "@alrisali/domain/lessons";
import type { Lesson } from "@alrisali/domain/lessons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { uploadFile } from "@/shared/lib/upload";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import Loader from "@/shared/ui/loader";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";

import { Field } from "../components/field";
import { SlidesEditor } from "../components/slides-editor";
import { CATEGORY_LABELS, isLessonCategory } from "../utils/labels";
import {
  addUploadingSlides,
  emptyLessonForm,
  failSlideUpload,
  finishSlideUpload,
  lessonToForm,
  publishBlocked,
  validateLessonForm,
} from "../utils/lesson-form";
import type { FieldErrors, LessonForm } from "../utils/lesson-form";

/** The `$id` that opens a fresh Lesson. */
export const NEW_LESSON_ID = "new";

const LessonEditor = ({ lesson }: { lesson: Lesson | null }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<LessonForm>(() =>
    lesson ? lessonToForm(lesson) : emptyLessonForm()
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const save = useMutation(
    orpc.lessons.save.mutationOptions({
      onSuccess: async (saved) => {
        await queryClient.invalidateQueries({ queryKey: orpc.lessons.key() });
        toast.success(
          `Saved ${saved.title.ar}${saved.published ? "" : " as a draft"}. Devices update on their next sync.`
        );
        await navigate({ to: "/admin/lessons" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  // Each chosen image is its own upload; options-level callbacks run for
  // every one, so each Slide records its own key or error.
  const upload = useMutation({
    mutationFn: ({ file }: { file: File; localId: string }) =>
      uploadFile("slide", file),
    onSuccess: (imageKey, { localId }) => {
      setForm((current) => finishSlideUpload(current, localId, imageKey));
    },
    onError: (error, { localId }) => {
      setForm((current) => failSlideUpload(current, localId, error.message));
    },
  });

  const addFiles = (files: File[]) => {
    const uploads = files.map((file) => ({
      file,
      localId: crypto.randomUUID(),
    }));
    setForm((current) =>
      addUploadingSlides(
        current,
        uploads.map(({ localId }) => localId)
      )
    );
    for (const variables of uploads) {
      upload.mutate(variables);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateLessonForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      toast.error("Fix the highlighted fields before saving.");
      return;
    }
    setErrors({});
    save.mutate(result.draft);
  };

  /** Uploads finish in the background, so edits apply to the latest form. */
  const change = (changes: Partial<LessonForm>) =>
    setForm((current) => ({ ...current, ...changes }));
  const blocked = publishBlocked(form);
  const saveLabel = form.published ? "Save and publish" : "Save draft";
  const bind = (field: "titleAr" | "titleEn") => ({
    id: `lesson-${field}`,
    value: form[field],
    "aria-invalid": errors[field] !== undefined,
    onChange: (event: { target: { value: string } }) =>
      change({ [field]: event.target.value }),
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {lesson ? `Edit ${lesson.title.ar}` : "New Lesson"}
          </h1>
          <p className="text-muted-foreground">
            A teaching Believers swipe through, one captioned image at a time.
          </p>
        </div>
        <Link
          to="/admin/lessons"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to Lessons
        </Link>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium">Details</legend>
          <Field
            id="lesson-titleAr"
            label="Title (Arabic)"
            error={errors.titleAr}
          >
            <Input {...bind("titleAr")} dir="rtl" lang="ar" />
          </Field>
          <Field
            id="lesson-titleEn"
            label="Title (English, optional)"
            hint="Left empty, English devices show the Arabic title."
            error={errors.titleEn}
          >
            <Input {...bind("titleEn")} />
          </Field>
          <Field
            id="lesson-descriptionAr"
            label="Description (Arabic, optional)"
            error={errors.descriptionAr}
          >
            <Textarea
              id="lesson-descriptionAr"
              dir="rtl"
              lang="ar"
              rows={4}
              value={form.descriptionAr}
              onChange={(event) =>
                change({ descriptionAr: event.target.value })
              }
            />
          </Field>
          <Field
            id="lesson-descriptionEn"
            label="Description (English, optional)"
            error={errors.descriptionEn}
          >
            <Textarea
              id="lesson-descriptionEn"
              rows={4}
              value={form.descriptionEn}
              onChange={(event) =>
                change({ descriptionEn: event.target.value })
              }
            />
          </Field>
          <Field id="lesson-category" label="Category" error={errors.category}>
            <NativeSelect
              id="lesson-category"
              className="w-full"
              value={form.category}
              onChange={(event) => {
                const { value } = event.target;
                if (isLessonCategory(value)) {
                  change({ category: value });
                }
              }}
            >
              {LESSON_CATEGORIES.map((category) => (
                <NativeSelectOption key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <div className="flex flex-col justify-end gap-1.5">
            <div className="flex items-center gap-3">
              <Switch
                id="lesson-published"
                checked={form.published}
                onCheckedChange={(published) => change({ published })}
              />
              <label htmlFor="lesson-published" className="text-sm">
                Published (shown on devices)
              </label>
            </div>
            {blocked ? (
              <p className="text-muted-foreground text-xs">
                Add at least one Slide to publish, or save it as a draft.
              </p>
            ) : null}
          </div>
        </fieldset>

        <SlidesEditor
          slides={form.slides}
          error={errors.slides}
          disabled={save.isPending}
          onChange={(slides) => change({ slides })}
          onAddFiles={addFiles}
        />

        {save.isError ? (
          <p role="alert" className="text-destructive text-sm">
            Could not save the Lesson: {save.error.message}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={save.isPending || blocked}>
            {save.isPending ? "Saving..." : saveLabel}
          </Button>
          {Object.keys(errors).length > 0 ? (
            <span className="text-destructive text-sm">
              Some fields need fixing.
            </span>
          ) : null}
        </div>
      </form>
    </main>
  );
};

export const LessonEditScreen = ({ id }: { id: string }) => {
  const isNew = id === NEW_LESSON_ID;
  const current = useQuery({
    ...orpc.lessons.get.queryOptions({ input: { id } }),
    enabled: !isNew,
  });

  if (isNew) {
    return <LessonEditor key={NEW_LESSON_ID} lesson={null} />;
  }
  if (current.isPending) {
    return <Loader />;
  }
  if (current.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Lesson: {current.error.message}
      </p>
    );
  }
  if (current.data === null) {
    return (
      <main className="flex flex-col gap-3 p-6">
        <p>There is no such Lesson.</p>
        <Link to="/admin/lessons" className="underline">
          Back to Lessons
        </Link>
      </main>
    );
  }
  return <LessonEditor key={current.data.id} lesson={current.data} />;
};
