import type { AdhanDraft } from "@alrisali/api/adhans";
import { MAX_TAKBIR_SECONDS } from "@alrisali/domain/shared";
import type { AdhanCatalogueEntry, AdhanCut } from "@alrisali/domain/shared";

/** One recording as the form holds it: an empty `key` means none chosen yet. */
export interface RecordingFields {
  key: string;
  seconds: number;
  bytes: number;
}

/** What the form edits; `id` is set only when editing a voice. */
export interface AdhanFields {
  id: string | null;
  name: { ar: string; en: string };
  credit: string;
  full: RecordingFields;
  takbir: RecordingFields;
}

/** The form fields that show an error. */
export type AdhanFieldPath =
  | "name.ar"
  | "name.en"
  | "credit"
  | "full.key"
  | "takbir.key";

export type AdhanFieldErrors = Partial<Record<AdhanFieldPath, string>>;

export type ValidatedAdhan =
  | { ok: true; draft: AdhanDraft }
  | { ok: false; problem: string; errors: AdhanFieldErrors };

const NO_RECORDING: RecordingFields = { key: "", seconds: 0, bytes: 0 };

export const emptyAdhanFields = (): AdhanFields => ({
  id: null,
  name: { ar: "", en: "" },
  credit: "",
  full: { ...NO_RECORDING },
  takbir: { ...NO_RECORDING },
});

export const adhanToFields = (entry: AdhanCatalogueEntry): AdhanFields => ({
  id: entry.id,
  name: { ...entry.name },
  credit: entry.credit,
  full: { ...entry.full },
  takbir: { ...entry.takbir },
});

/** A duration for people: `3:05`, or `8 s` under a minute. */
export const formatSeconds = (seconds: number): string => {
  const whole = Math.round(seconds);
  if (whole < 60) {
    return `${whole} s`;
  }
  const rest = String(whole % 60).padStart(2, "0");
  return `${Math.floor(whole / 60)}:${rest}`;
};

const KIBIBYTE = 1024;
const MEBIBYTE = KIBIBYTE * 1024;

/** A file size for people. */
export const formatBytes = (bytes: number): string => {
  if (bytes >= MEBIBYTE) {
    return `${(bytes / MEBIBYTE).toFixed(1)} MiB`;
  }
  return `${Math.max(1, Math.round(bytes / KIBIBYTE))} KiB`;
};

/** Why a recording of `seconds` cannot be the `cut`, or null when it can. */
export const durationProblem = (
  cut: AdhanCut,
  seconds: number
): string | null => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "The recording's duration could not be read.";
  }
  if (cut === "takbir" && seconds > MAX_TAKBIR_SECONDS) {
    return `The takbir is ${formatSeconds(seconds)} long; iOS plays at most ${MAX_TAKBIR_SECONDS} s of a notification sound.`;
  }
  return null;
};

const recordingProblem = (
  cut: AdhanCut,
  label: string,
  recording: RecordingFields
): string | null => {
  if (recording.key === "") {
    return `Upload the ${label}.`;
  }
  if (!Number.isInteger(recording.bytes) || recording.bytes <= 0) {
    return `The ${label}'s size is unknown: upload it again.`;
  }
  return durationProblem(cut, recording.seconds);
};

/** The fields as the contract's draft, or the errors to show by field. */
export const validateAdhanFields = (fields: AdhanFields): ValidatedAdhan => {
  const name = { ar: fields.name.ar.trim(), en: fields.name.en.trim() };
  const credit = fields.credit.trim();
  const errors: AdhanFieldErrors = {};
  if (name.ar === "") {
    errors["name.ar"] = "Enter the Arabic name.";
  }
  if (name.en === "") {
    errors["name.en"] = "Enter the English name.";
  }
  if (credit === "") {
    errors.credit = "Enter who recorded it and under what licence.";
  }
  const full = recordingProblem("full", "full adhan", fields.full);
  if (full) {
    errors["full.key"] = full;
  }
  const takbir = recordingProblem("takbir", "takbir cut", fields.takbir);
  if (takbir) {
    errors["takbir.key"] = takbir;
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, problem: "Fix the highlighted fields.", errors };
  }
  return {
    ok: true,
    draft: {
      ...(fields.id ? { id: fields.id } : {}),
      name,
      credit,
      full: { ...fields.full },
      takbir: { ...fields.takbir },
    },
  };
};
