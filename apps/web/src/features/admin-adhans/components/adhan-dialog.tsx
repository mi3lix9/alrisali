import {
  ADHAN_UPLOAD_PURPOSES,
  MAX_TAKBIR_SECONDS,
} from "@alrisali/domain/shared";
import type { AdhanCatalogueEntry, AdhanCut } from "@alrisali/domain/shared";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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

import {
  adhanToFields,
  durationProblem,
  emptyAdhanFields,
  formatBytes,
  formatSeconds,
  validateAdhanFields,
} from "../utils/adhan-form";
import type { RecordingFields } from "../utils/adhan-form";
import { readAudioDuration } from "../utils/audio-duration";
import { Field } from "./field";

/** The first message among a field's errors, which are strings here. */
const firstError = (errors: readonly unknown[]): string | undefined =>
  errors.find((error): error is string => typeof error === "string");

/**
 * Reads the file's duration, checks it for its cut, then uploads it. The
 * recording's size is the file's, which devices compare their download to.
 */
const uploadRecording = async (
  cut: AdhanCut,
  file: File
): Promise<RecordingFields> => {
  const seconds = await readAudioDuration(file);
  const problem = durationProblem(cut, seconds);
  if (problem) {
    throw new Error(`${file.name}: ${problem}`);
  }
  const key = await uploadFile(ADHAN_UPLOAD_PURPOSES[cut], file);
  return { key, seconds, bytes: file.size };
};

/** A file input for one recording, with what is chosen so far under it. */
const RecordingInput = ({
  id,
  label,
  cut,
  hint,
  recording,
  fileName,
  upload,
  disabled,
  error,
  onFile,
}: {
  id: string;
  label: string;
  cut: AdhanCut;
  hint: string;
  recording: RecordingFields;
  /** The name of the file chosen in this dialog, if any. */
  fileName: string | null;
  upload: UseMutationResult<RecordingFields, Error, File>;
  disabled: boolean;
  error: string | undefined;
  onFile: (file: File) => void;
}) => (
  <Field
    id={id}
    label={label}
    hint={hint}
    error={upload.error?.message ?? error}
  >
    <Input
      id={id}
      type="file"
      accept={acceptedTypes(ADHAN_UPLOAD_PURPOSES[cut])}
      disabled={disabled}
      aria-invalid={upload.isError || error !== undefined}
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) {
          onFile(file);
        }
      }}
    />
    {upload.isPending ? (
      <p className="text-muted-foreground text-xs" aria-live="polite">
        Checking and uploading {upload.variables.name} (
        {formatBytes(upload.variables.size)})...
      </p>
    ) : null}
    {recording.key !== "" && !upload.isPending ? (
      <p className="text-xs">
        {fileName ?? `Current ${cut === "full" ? "adhan" : "takbir"}`} ·{" "}
        {formatSeconds(recording.seconds)} · {formatBytes(recording.bytes)}
      </p>
    ) : null}
  </Field>
);

/**
 * Adds a voice (`adhan` null) or edits one. A recording uploads as soon as it
 * is chosen; saving stores its key, duration and size with the voice.
 */
export const AdhanDialog = ({
  adhan,
  onClose,
}: {
  adhan: AdhanCatalogueEntry | null;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  /** The names of the files chosen in this dialog, once they uploaded. */
  const [fullName, setFullName] = useState<string | null>(null);
  const [takbirName, setTakbirName] = useState<string | null>(null);

  const save = useMutation(
    orpc.adhans.save.mutationOptions({
      onSuccess: async (saved) => {
        await queryClient.invalidateQueries({ queryKey: orpc.adhans.key() });
        toast.success(
          `${adhan ? "Updated" : "Added"} ${saved.name.en}. Devices list it on their next sync.`
        );
        onClose();
      },
    })
  );

  const form = useForm({
    defaultValues: adhan ? adhanToFields(adhan) : emptyAdhanFields(),
    validators: {
      onSubmit: ({ value }) => {
        const result = validateAdhanFields(value);
        return result.ok
          ? undefined
          : { form: result.problem, fields: result.errors };
      },
    },
    onSubmit: ({ value }) => {
      const result = validateAdhanFields(value);
      if (result.ok) {
        save.mutate(result.draft);
      }
    },
  });

  const fullUpload = useMutation({
    mutationFn: (file: File) => uploadRecording("full", file),
    onSuccess: (recording, file) => {
      form.setFieldValue("full", recording);
      setFullName(file.name);
    },
  });
  const takbirUpload = useMutation({
    mutationFn: (file: File) => uploadRecording("takbir", file),
    onSuccess: (recording, file) => {
      form.setFieldValue("takbir", recording);
      setTakbirName(file.name);
    },
  });

  const busy = fullUpload.isPending || takbirUpload.isPending || save.isPending;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{adhan ? "Edit voice" : "Add voice"}</DialogTitle>
            <DialogDescription>
              A Believer must have both recordings downloaded to use a voice.
              Publish only recordings you are licensed to distribute.
            </DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Details</legend>
            <form.Field name="name.ar">
              {(field) => (
                <Field
                  id="adhan-name-ar"
                  label="Name (Arabic)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Input
                    id="adhan-name-ar"
                    dir="rtl"
                    lang="ar"
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="name.en">
              {(field) => (
                <Field
                  id="adhan-name-en"
                  label="Name (English)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Input
                    id="adhan-name-en"
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <div className="sm:col-span-2">
              <form.Field name="credit">
                {(field) => (
                  <Field
                    id="adhan-credit"
                    label="Credit"
                    hint="Who recorded it and under what licence."
                    error={firstError(field.state.meta.errors)}
                  >
                    <Input
                      id="adhan-credit"
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </Field>
                )}
              </form.Field>
            </div>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Recordings</legend>
            <form.Field name="full.key">
              {(field) => (
                <form.Subscribe selector={({ values }) => values.full}>
                  {(recording) => (
                    <RecordingInput
                      id="adhan-full"
                      label="Full adhan"
                      cut="full"
                      hint={`${describeUploadRules("adhan-full")} Choosing a file replaces the current one.`}
                      recording={recording}
                      fileName={fullName}
                      upload={fullUpload}
                      disabled={busy}
                      error={firstError(field.state.meta.errors)}
                      onFile={(file) => fullUpload.mutate(file)}
                    />
                  )}
                </form.Subscribe>
              )}
            </form.Field>
            <form.Field name="takbir.key">
              {(field) => (
                <form.Subscribe selector={({ values }) => values.takbir}>
                  {(recording) => (
                    <RecordingInput
                      id="adhan-takbir"
                      label="Takbir cut"
                      cut="takbir"
                      hint={`${describeUploadRules("adhan-takbir")} At most ${MAX_TAKBIR_SECONDS} s: the sound of the At-Time Alert. Choosing a file replaces the current one.`}
                      recording={recording}
                      fileName={takbirName}
                      upload={takbirUpload}
                      disabled={busy}
                      error={firstError(field.state.meta.errors)}
                      onFile={(file) => takbirUpload.mutate(file)}
                    />
                  )}
                </form.Subscribe>
              )}
            </form.Field>
          </fieldset>

          <form.Subscribe selector={({ errors }) => errors}>
            {(errors) => {
              const problem = save.error?.message ?? firstError(errors);
              return problem ? (
                <p role="alert" className="text-destructive text-sm">
                  {problem}
                </p>
              ) : null;
            }}
          </form.Subscribe>

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
