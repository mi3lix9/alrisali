import type { ManagedLibraryAsset } from "@alrisali/api/library-assets";
import {
  LIBRARY_CATEGORIES,
  libraryAssetKindOf,
} from "@alrisali/domain/library-assets";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";

import {
  STRUCTURED_TEXT_EXAMPLE,
  assetToFields,
  emptyAssetFields,
  structuredTextProblem,
  validateAssetFields,
} from "../utils/asset-form";
import { CATEGORY_LABELS, KIND_LABELS } from "../utils/labels";
import { formatFileSize, nextOrder } from "../utils/library-table";
import { Field } from "./field";

/** The first message among a field's errors, which are strings here. */
const firstError = (errors: readonly unknown[]): string | undefined =>
  errors.find((error): error is string => typeof error === "string");

/** Checks a structured-text file in the browser, then uploads the file. */
const uploadAssetFile = async (file: File) => {
  const isJson =
    file.type === "application/json" ||
    file.name.toLowerCase().endsWith(".json");
  if (isJson) {
    const problem = structuredTextProblem(await file.text());
    if (problem) {
      throw new Error(`${file.name}: ${problem}`);
    }
  }
  const key = await uploadFile("library-asset", file);
  const kind = libraryAssetKindOf(key);
  if (!kind) {
    throw new Error(`${file.name} is not a PDF, audio, video or JSON file.`);
  }
  return { key, kind, name: file.name, size: file.size };
};

/**
 * Adds a Library Asset (`asset` null) or edits one. Its file and cover
 * upload as soon as they are chosen; saving stores their keys with it.
 */
export const AssetDialog = ({
  asset,
  assets,
  previews,
  onClose,
}: {
  asset: ManagedLibraryAsset | null;
  /** Every Library Asset, to place a new one last in its category. */
  assets: readonly ManagedLibraryAsset[];
  /** Short-lived URLs of the assets' files and covers, by key. */
  previews: Readonly<Record<string, string>>;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  /** The name of the file chosen in this dialog, once it uploaded. */
  const [fileName, setFileName] = useState<string | null>(null);
  /** A local preview of the cover chosen in this dialog. */
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(
    () => () => {
      for (const url of objectUrls.current) {
        URL.revokeObjectURL(url);
      }
    },
    []
  );

  const save = useMutation(
    orpc.libraryAssets.save.mutationOptions({
      onSuccess: async (saved) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.libraryAssets.list.queryKey(),
        });
        toast.success(
          `${asset ? "Updated" : "Added"} ${saved.title.ar}. ${
            saved.published
              ? "Devices get it on their next sync."
              : "Unpublished: it stays on the server."
          }`
        );
        onClose();
      },
    })
  );

  const form = useForm({
    defaultValues: asset
      ? assetToFields(asset)
      : emptyAssetFields(
          LIBRARY_CATEGORIES[0],
          nextOrder(assets, LIBRARY_CATEGORIES[0])
        ),
    validators: {
      onSubmit: ({ value }) => {
        const result = validateAssetFields(value);
        return result.ok
          ? undefined
          : { form: result.problem, fields: result.errors };
      },
    },
    onSubmit: ({ value }) => {
      const result = validateAssetFields(value);
      if (result.ok) {
        save.mutate(result.draft);
      }
    },
  });

  const fileUpload = useMutation({
    mutationFn: uploadAssetFile,
    onSuccess: ({ key, kind, name, size }) => {
      form.setFieldValue("fileKey", key);
      form.setFieldValue("fileSize", size);
      form.setFieldValue("kind", kind);
      setFileName(name);
    },
  });

  const coverUpload = useMutation({
    mutationFn: (file: File) => uploadFile("library-cover", file),
    onSuccess: (key, file) => {
      form.setFieldValue("coverKey", key);
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      setCoverSrc(url);
    },
  });

  const busy = fileUpload.isPending || coverUpload.isPending || save.isPending;

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
            <DialogTitle>
              {asset ? "Edit Library Asset" : "Add Library Asset"}
            </DialogTitle>
            <DialogDescription>
              Arabic is required; English is optional and falls back to the
              Arabic on English devices.
            </DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Details</legend>
            <form.Field name="title.ar">
              {(field) => (
                <Field
                  id="asset-title-ar"
                  label="Title (Arabic)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Input
                    id="asset-title-ar"
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
            <form.Field name="title.en">
              {(field) => (
                <Field
                  id="asset-title-en"
                  label="Title (English, optional)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Input
                    id="asset-title-en"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="author.ar">
              {(field) => (
                <Field
                  id="asset-author-ar"
                  label="Author (Arabic, optional)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Input
                    id="asset-author-ar"
                    dir="rtl"
                    lang="ar"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="author.en">
              {(field) => (
                <Field
                  id="asset-author-en"
                  label="Author (English, optional)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Input
                    id="asset-author-en"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="description.ar">
              {(field) => (
                <Field
                  id="asset-description-ar"
                  label="Description (Arabic, optional)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Textarea
                    id="asset-description-ar"
                    dir="rtl"
                    lang="ar"
                    rows={4}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="description.en">
              {(field) => (
                <Field
                  id="asset-description-en"
                  label="Description (English, optional)"
                  error={firstError(field.state.meta.errors)}
                >
                  <Textarea
                    id="asset-description-en"
                    rows={4}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Place</legend>
            <form.Field
              name="category"
              listeners={{
                onChange: ({ value }) => {
                  // A new asset goes last in its category unless the Admin
                  // chose its order.
                  if (!asset && !form.getFieldMeta("order")?.isDirty) {
                    form.setFieldValue("order", nextOrder(assets, value), {
                      dontUpdateMeta: true,
                    });
                  }
                },
              }}
            >
              {(field) => (
                <Field
                  id="asset-category"
                  label="Category"
                  error={firstError(field.state.meta.errors)}
                >
                  <NativeSelect
                    id="asset-category"
                    className="w-full"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        LIBRARY_CATEGORIES.find(
                          (category) => category === event.target.value
                        ) ?? field.state.value
                      )
                    }
                  >
                    {LIBRARY_CATEGORIES.map((category) => (
                      <NativeSelectOption key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            </form.Field>
            <form.Field name="order">
              {(field) => (
                <Field
                  id="asset-order"
                  label="Order"
                  hint="Smallest first within its category."
                  error={firstError(field.state.meta.errors)}
                >
                  <Input
                    id="asset-order"
                    type="number"
                    min={0}
                    step={1}
                    value={
                      Number.isNaN(field.state.value) ? "" : field.state.value
                    }
                    aria-invalid={field.state.meta.errors.length > 0}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(event.target.valueAsNumber)
                    }
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="published">
              {(field) => (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Switch
                    id="asset-published"
                    checked={field.state.value}
                    onCheckedChange={(published) =>
                      field.handleChange(published)
                    }
                  />
                  <label htmlFor="asset-published" className="text-sm">
                    Published: devices get it on their next sync. Unpublished
                    assets stay only on the server.
                  </label>
                </div>
              )}
            </form.Field>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="mb-2 text-sm font-medium">Files</legend>
            <form.Field name="fileKey">
              {(field) => (
                <Field
                  id="asset-file"
                  label="File"
                  error={
                    fileUpload.error?.message ??
                    firstError(field.state.meta.errors)
                  }
                >
                  <Input
                    id="asset-file"
                    type="file"
                    accept={acceptedTypes("library-asset")}
                    disabled={busy}
                    aria-invalid={
                      fileUpload.isError || field.state.meta.errors.length > 0
                    }
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) {
                        fileUpload.mutate(file);
                      }
                    }}
                  />
                  <form.Subscribe
                    selector={({ values }) => ({
                      kind: values.kind,
                      fileSize: values.fileSize,
                    })}
                  >
                    {({ kind, fileSize }) => {
                      if (fileUpload.isPending) {
                        return (
                          <p
                            className="text-muted-foreground text-xs"
                            aria-live="polite"
                          >
                            Uploading {fileUpload.variables.name} (
                            {formatFileSize(fileUpload.variables.size)})...
                          </p>
                        );
                      }
                      if (!field.state.value) {
                        return null;
                      }
                      const preview = previews[field.state.value];
                      return (
                        <p className="text-xs">
                          {KIND_LABELS[kind]} · {fileName ?? "Current file"} ·{" "}
                          {formatFileSize(fileSize)}
                          {preview && !fileName ? (
                            <>
                              {" · "}
                              <a
                                href={preview}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                Open
                              </a>
                            </>
                          ) : null}
                        </p>
                      );
                    }}
                  </form.Subscribe>
                  <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                    <p>
                      {describeUploadRules("library-asset")} The file decides
                      the kind: PDF, audio (MP3, M4A), video (MP4) or structured
                      text (JSON). A JSON file is checked before it uploads and
                      must look like:
                    </p>
                    <pre
                      dir="ltr"
                      className="bg-muted overflow-x-auto p-2 font-mono"
                    >
                      {STRUCTURED_TEXT_EXAMPLE}
                    </pre>
                  </div>
                </Field>
              )}
            </form.Field>

            <form.Field name="coverKey">
              {(field) => {
                const src =
                  coverSrc ??
                  (field.state.value ? previews[field.state.value] : undefined);
                return (
                  <Field
                    id="asset-cover"
                    label="Cover (optional)"
                    hint={describeUploadRules("library-cover")}
                    error={
                      coverUpload.error?.message ??
                      firstError(field.state.meta.errors)
                    }
                  >
                    <div className="flex items-center gap-3">
                      {field.state.value && src ? (
                        <img
                          src={src}
                          alt="Cover"
                          className="h-24 w-18 shrink-0 border object-cover"
                        />
                      ) : (
                        <div className="bg-muted h-24 w-18 shrink-0 border" />
                      )}
                      <div className="flex flex-col gap-2">
                        <Input
                          id="asset-cover"
                          type="file"
                          accept={acceptedTypes("library-cover")}
                          disabled={busy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) {
                              coverUpload.mutate(file);
                            }
                          }}
                        />
                        {coverUpload.isPending ? (
                          <p
                            className="text-muted-foreground text-xs"
                            aria-live="polite"
                          >
                            Uploading cover...
                          </p>
                        ) : null}
                        {field.state.value && !coverUpload.isPending ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="self-start"
                            disabled={busy}
                            onClick={() => {
                              field.handleChange(null);
                              setCoverSrc(null);
                            }}
                          >
                            Remove cover
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </Field>
                );
              }}
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
