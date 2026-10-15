import { fileUrl } from "@alrisali/api/shared";
import type { Speaker } from "@alrisali/domain/gatherings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { ENV } from "@/env";
import { orpc } from "@/shared/lib/orpc";
import {
  acceptedTypes,
  describeUploadRules,
  uploadFile,
} from "@/shared/lib/upload";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

import { speakerToForm, validateSpeakerForm } from "../utils/gathering-form";
import type { FieldErrors, SpeakerForm } from "../utils/gathering-form";
import { Field } from "./field";

/**
 * Adds a Speaker (`speaker` null) or edits one. The photo uploads as soon as
 * it is chosen; saving stores its key with the Speaker.
 */
export const SpeakerDialog = ({
  speaker,
  onClose,
}: {
  speaker: Speaker | null;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SpeakerForm>(() => speakerToForm(speaker));
  const [errors, setErrors] = useState<FieldErrors>({});

  const upload = useMutation({
    mutationFn: (file: File) => uploadFile("speaker-photo", file),
    onSuccess: (photoKey) => {
      setForm((current) => ({ ...current, photoKey }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const save = useMutation(
    orpc.gatherings.speakers.save.mutationOptions({
      onSuccess: async (saved) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.gatherings.list.queryKey(),
        });
        toast.success(
          `${speaker ? "Updated" : "Added"} ${saved.name.ar}. Devices update on their next sync.`
        );
        onClose();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const busy = upload.isPending || save.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateSpeakerForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate(result.draft);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>
              {speaker ? "Edit Speaker" : "Add Speaker"}
            </DialogTitle>
            <DialogDescription>
              The sheikh or orator who leads Gatherings.
            </DialogDescription>
          </DialogHeader>

          <Field
            id="speaker-name-ar"
            label="Name (Arabic)"
            error={errors["name.ar"]}
          >
            <Input
              id="speaker-name-ar"
              dir="rtl"
              lang="ar"
              value={form.nameAr}
              aria-invalid={Boolean(errors["name.ar"])}
              onChange={(event) =>
                setForm({ ...form, nameAr: event.target.value })
              }
            />
          </Field>
          <Field
            id="speaker-name-en"
            label="Name (English, optional)"
            hint="Left empty, English devices show the Arabic name."
            error={errors["name.en"]}
          >
            <Input
              id="speaker-name-en"
              value={form.nameEn}
              onChange={(event) =>
                setForm({ ...form, nameEn: event.target.value })
              }
            />
          </Field>

          <Field
            id="speaker-photo"
            label="Photo (optional)"
            hint={describeUploadRules("speaker-photo")}
            error={errors.photoKey}
          >
            <div className="flex items-center gap-3">
              {form.photoKey ? (
                <img
                  src={fileUrl(ENV.VITE_SERVER_URL, form.photoKey)}
                  alt={form.nameAr || "Speaker"}
                  className="size-16 shrink-0 border object-cover"
                />
              ) : (
                <div className="bg-muted size-16 shrink-0 border" />
              )}
              <div className="flex flex-col gap-2">
                <Input
                  id="speaker-photo"
                  type="file"
                  accept={acceptedTypes("speaker-photo")}
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) {
                      upload.mutate(file);
                    }
                  }}
                />
                {upload.isPending ? (
                  <p
                    className="text-muted-foreground text-xs"
                    aria-live="polite"
                  >
                    Uploading photo...
                  </p>
                ) : null}
                {form.photoKey && !upload.isPending ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    disabled={busy}
                    onClick={() => setForm({ ...form, photoKey: null })}
                  >
                    Remove photo
                  </Button>
                ) : null}
              </div>
            </div>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
