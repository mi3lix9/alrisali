import { LESSON_CATEGORIES } from "@alrisali/domain/lessons";
import type { Lesson, LessonCategory } from "@alrisali/domain/lessons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import Loader from "@/shared/ui/loader";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";

import { ConfirmDeleteDialog } from "../components/confirm-delete-dialog";
import { CATEGORY_LABELS, isLessonCategory } from "../utils/labels";
import { moveItem } from "../utils/move-item";
import { NEW_LESSON_ID } from "./lesson-edit-screen";

const SYNC_NOTE = "Devices update on their next sync.";

const onError = (error: Error) => {
  toast.error(error.message);
};

export const LessonsScreen = () => {
  const queryClient = useQueryClient();
  const lessons = useQuery(orpc.lessons.list.queryOptions());
  const [category, setCategory] = useState<LessonCategory | null>(null);
  const [deleting, setDeleting] = useState<Lesson | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: orpc.lessons.key() });

  const reorder = useMutation(
    orpc.lessons.reorder.mutationOptions({
      onSuccess: async () => {
        await refresh();
        toast.success(`Order saved. ${SYNC_NOTE}`);
      },
      onError,
    })
  );
  const remove = useMutation(
    orpc.lessons.remove.mutationOptions({
      onSuccess: async () => {
        setDeleting(null);
        await refresh();
        toast.success(`Lesson deleted. ${SYNC_NOTE}`);
      },
      onError,
    })
  );
  const busy = reorder.isPending || remove.isPending;

  if (lessons.isPending) {
    return <Loader />;
  }
  if (lessons.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Lessons: {lessons.error.message}
      </p>
    );
  }

  const ids = lessons.data.map(({ id }) => id);
  // Positions in the whole order, so moving within a category swaps a Lesson
  // with the neighbour shown beside it.
  const shown = lessons.data
    .map((lesson, position) => ({ lesson, position }))
    .filter(({ lesson }) => category === null || lesson.category === category);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lessons</h1>
          <p className="text-muted-foreground">
            Slide Lessons in the order devices list them. Only published ones
            are shown to Believers.
          </p>
        </div>
        <Link
          to="/admin/lessons/$id"
          params={{ id: NEW_LESSON_ID }}
          className={buttonVariants()}
        >
          New Lesson
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="lessons-category">Category</Label>
        <NativeSelect
          id="lessons-category"
          value={category ?? ""}
          onChange={(event) => {
            const { value } = event.target;
            setCategory(isLessonCategory(value) ? value : null);
          }}
        >
          <NativeSelectOption value="">All categories</NativeSelectOption>
          {LESSON_CATEGORIES.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {CATEGORY_LABELS[option]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {shown.length === 0 ? (
        <p className="text-muted-foreground">
          {category === null
            ? "No Lessons yet."
            : "No Lessons in this category."}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {shown.map(({ lesson, position }, index) => {
            const previous = shown[index - 1];
            const next = shown[index + 1];
            return (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center gap-4 border p-4"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-baseline gap-3">
                    <span dir="rtl" lang="ar" className="font-medium">
                      {lesson.title.ar}
                    </span>
                    {lesson.title.en ? (
                      <span className="text-muted-foreground">
                        {lesson.title.en}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
                    <span>{CATEGORY_LABELS[lesson.category]}</span>
                    <span>
                      {lesson.slides.length} Slide
                      {lesson.slides.length === 1 ? "" : "s"}
                    </span>
                    {lesson.published ? (
                      <Badge>Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/lessons/$id"
                    params={{ id: lesson.id }}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    Edit
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Move ${lesson.title.ar} up`}
                    disabled={busy || previous === undefined}
                    onClick={() => {
                      if (previous) {
                        reorder.mutate({
                          ids: moveItem(ids, position, previous.position),
                        });
                      }
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Move ${lesson.title.ar} down`}
                    disabled={busy || next === undefined}
                    onClick={() => {
                      if (next) {
                        reorder.mutate({
                          ids: moveItem(ids, position, next.position),
                        });
                      }
                    }}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setDeleting(lesson)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <ConfirmDeleteDialog
        name={deleting?.title.ar ?? null}
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) {
            remove.mutate({ id: deleting.id });
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </main>
  );
};
