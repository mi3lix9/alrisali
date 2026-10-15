import { libraryAssetDraftSchema } from "@alrisali/api/library-assets";
import type {
  LibraryAssetDraft,
  ManagedLibraryAsset,
} from "@alrisali/api/library-assets";
import { structuredTextSchema } from "@alrisali/domain/library-assets";
import type { LibraryCategory } from "@alrisali/domain/library-assets";
import type { z } from "zod";

/** The form edits the draft schema's input; saving sends its output. */
export type AssetFields = z.input<typeof libraryAssetDraftSchema>;

/** The form fields that show an error. */
const FIELD_PATHS = [
  "title.ar",
  "title.en",
  "author.ar",
  "author.en",
  "description.ar",
  "description.en",
  "category",
  "kind",
  "fileKey",
  "coverKey",
  "order",
] as const;

export type AssetFieldPath = (typeof FIELD_PATHS)[number];

export type AssetFieldErrors = Partial<Record<AssetFieldPath, string>>;

export type ValidatedAsset =
  | { ok: true; draft: LibraryAssetDraft }
  | {
      ok: false;
      errors: AssetFieldErrors;
      /** A problem no field shows, such as an unknown id. */
      problem?: string;
    };

const NO_TEXT = { ar: "", en: "" };

/** A new asset: published, placed at `order` in `category`, no file yet. */
export const emptyAssetFields = (
  category: LibraryCategory,
  order: number
): AssetFields => ({
  title: NO_TEXT,
  author: NO_TEXT,
  description: NO_TEXT,
  category,
  kind: "pdf",
  fileKey: "",
  fileSize: 0,
  coverKey: null,
  order,
  published: true,
});

export const assetToFields = (asset: ManagedLibraryAsset): AssetFields => ({
  id: asset.id,
  title: asset.title,
  author: asset.author,
  description: asset.description,
  category: asset.category,
  kind: asset.kind,
  fileKey: asset.fileKey,
  fileSize: asset.fileSize,
  coverKey: asset.coverKey,
  order: asset.order,
  published: asset.published,
});

const isFieldPath = (path: string): path is AssetFieldPath =>
  (FIELD_PATHS as readonly string[]).includes(path);

const describeIssue = (field: string, issue: z.core.$ZodIssue): string => {
  if (field === "fileKey") {
    return issue.code === "custom" && issue.path.join(".") === "fileKey"
      ? "The file does not match the asset's kind. Upload it again."
      : "Upload the asset's file.";
  }
  if (field === "order") {
    return "Enter a whole number, 0 or more";
  }
  if (issue.code === "too_small" && issue.origin === "string") {
    return "Required";
  }
  return issue.message;
};

/** The fields as the contract's draft, or the errors to show by field. */
export const validateAssetFields = (fields: AssetFields): ValidatedAsset => {
  const result = libraryAssetDraftSchema.safeParse(fields);
  if (result.success) {
    return { ok: true, draft: result.data };
  }
  const errors: AssetFieldErrors = {};
  let problem: string | undefined;
  for (const issue of result.error.issues) {
    // A file's size shows under the file.
    const path = issue.path.join(".");
    const field = path === "fileSize" ? "fileKey" : path;
    if (isFieldPath(field)) {
      errors[field] ??= describeIssue(field, issue);
    } else {
      problem ??= `${field}: ${issue.message}`;
    }
  }
  return problem === undefined
    ? { ok: false, errors }
    : { ok: false, errors, problem };
};

/** A short structured-text file, for the help under the file input. */
export const STRUCTURED_TEXT_EXAMPLE = `{
  "sections": [
    {
      "title": { "ar": "الباب الأول", "en": "Chapter one" },
      "passages": [{ "ar": "النص", "en": "The text" }]
    }
  ]
}`;

const EXPECTED_SHAPE =
  'It needs { "sections": [{ "title": { "ar", "en" }, "passages": [{ "ar", "en" }] }] }: at least one section, each with at least one passage in Arabic; titles and English are optional.';

/**
 * Why `text` is not a structured-text Library Asset, or null when it is:
 * checked in the browser before the file uploads.
 */
export const structuredTextProblem = (text: string): string | null => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return `The file is not valid JSON. ${EXPECTED_SHAPE}`;
  }
  const result = structuredTextSchema.safeParse(value);
  if (result.success) {
    return null;
  }
  const [issue] = result.error.issues;
  // A zod path as people read it, such as `sections[0].passages`.
  const where =
    issue && issue.path.length > 0
      ? issue.path
          .map((part) =>
            typeof part === "number" ? `[${part}]` : `.${String(part)}`
          )
          .join("")
          .replace(/^\./u, "")
      : "the top level";
  return `The JSON is not a structured text (at ${where}: ${issue?.message ?? "invalid"}). ${EXPECTED_SHAPE}`;
};
