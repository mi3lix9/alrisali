import { fileUrl } from "@alrisali/api/shared";

import { ENV } from "@/env";
import { acceptedTypes, describeUploadRules } from "@/shared/lib/upload";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import type { SlideForm } from "../utils/lesson-form";
import { moveItem } from "../utils/move-item";
import { Field } from "./field";

const SlideImage = ({ slide, index }: { slide: SlideForm; index: number }) => {
  if (slide.imageKey) {
    return (
      <img
        src={fileUrl(ENV.VITE_SERVER_URL, slide.imageKey)}
        alt={slide.captionAr || `Slide ${index + 1}`}
        className="aspect-video w-48 shrink-0 border object-cover"
      />
    );
  }
  return (
    <div className="bg-muted text-muted-foreground flex aspect-video w-48 shrink-0 items-center justify-center border p-2 text-center text-xs">
      {slide.upload?.status === "failed" ? "Upload failed" : "Uploading..."}
    </div>
  );
};

/**
 * The Lesson's Slides in order: each image with its caption, moved, removed,
 * and new images added at the end, each uploading on its own.
 */
export const SlidesEditor = ({
  slides,
  error,
  disabled,
  onChange,
  onAddFiles,
}: {
  slides: SlideForm[];
  error?: string | undefined;
  disabled: boolean;
  onChange: (slides: SlideForm[]) => void;
  onAddFiles: (files: File[]) => void;
}) => {
  const update = (localId: string, changes: Partial<SlideForm>) =>
    onChange(
      slides.map((slide) =>
        slide.localId === localId ? { ...slide, ...changes } : slide
      )
    );

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Slides</h2>
        <p className="text-muted-foreground text-sm">
          Images with captions, in the order Believers swipe through them.
        </p>
      </div>

      {slides.length === 0 ? (
        <p className="text-muted-foreground text-sm">No Slides yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {slides.map((slide, index) => (
            <li
              key={slide.localId}
              className="flex flex-wrap items-start gap-4 border p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">
                  Slide {index + 1}
                </span>
                <SlideImage slide={slide} index={index} />
                {slide.upload?.status === "failed" ? (
                  <p className="text-destructive max-w-48 text-xs">
                    {slide.upload.error}
                  </p>
                ) : null}
              </div>

              <div className="grid min-w-64 flex-1 gap-3">
                <Field
                  id={`slide-${slide.localId}-captionAr`}
                  label="Caption (Arabic, optional)"
                >
                  <Input
                    id={`slide-${slide.localId}-captionAr`}
                    dir="rtl"
                    lang="ar"
                    value={slide.captionAr}
                    onChange={(event) =>
                      update(slide.localId, { captionAr: event.target.value })
                    }
                  />
                </Field>
                <Field
                  id={`slide-${slide.localId}-captionEn`}
                  label="Caption (English, optional)"
                >
                  <Input
                    id={`slide-${slide.localId}-captionEn`}
                    value={slide.captionEn}
                    onChange={(event) =>
                      update(slide.localId, { captionEn: event.target.value })
                    }
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Move Slide ${index + 1} up`}
                  disabled={disabled || index === 0}
                  onClick={() => onChange(moveItem(slides, index, index - 1))}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Move Slide ${index + 1} down`}
                  disabled={disabled || index === slides.length - 1}
                  onClick={() => onChange(moveItem(slides, index, index + 1))}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={disabled}
                  onClick={() =>
                    onChange(
                      slides.filter(({ localId }) => localId !== slide.localId)
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Field
        id="lesson-slide-images"
        label="Add Slides"
        hint={`One Slide per image. ${describeUploadRules("slide")}`}
        error={error}
      >
        <Input
          id="lesson-slide-images"
          type="file"
          multiple
          accept={acceptedTypes("slide")}
          disabled={disabled}
          aria-invalid={error !== undefined}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            if (files.length > 0) {
              onAddFiles(files);
            }
          }}
        />
      </Field>
    </section>
  );
};
