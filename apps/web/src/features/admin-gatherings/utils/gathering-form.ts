import {
  gatheringDraftSchema,
  speakerDraftSchema,
} from "@alrisali/api/gatherings";
import type { GatheringDraft, SpeakerDraft } from "@alrisali/api/gatherings";
import type {
  Attendance,
  Gathering,
  GatheringType,
  Speaker,
} from "@alrisali/domain/gatherings";
import type { z } from "zod";

/** Field errors by the draft's dotted path, such as `venue.latitude`. */
export type FieldErrors = Record<string, string>;

export type Validated<T> =
  | { ok: true; draft: T }
  | { ok: false; errors: FieldErrors };

/** A Gathering as its form holds it: every input's text. */
export interface GatheringForm {
  id: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  type: GatheringType;
  date: string;
  startTime: string;
  endTime: string;
  venueNameAr: string;
  venueNameEn: string;
  address: string;
  latitude: string;
  longitude: string;
  /** Empty for no Speaker. */
  speakerId: string;
  livestreamUrl: string;
  attendance: Attendance;
  active: boolean;
}

export const emptyGatheringForm = (): GatheringForm => ({
  id: null,
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  type: "majlis",
  date: "",
  startTime: "",
  endTime: "",
  venueNameAr: "",
  venueNameEn: "",
  address: "",
  latitude: "",
  longitude: "",
  speakerId: "",
  livestreamUrl: "",
  attendance: "everyone",
  active: true,
});

export const gatheringToForm = (gathering: Gathering): GatheringForm => ({
  id: gathering.id,
  titleAr: gathering.title.ar,
  titleEn: gathering.title.en,
  descriptionAr: gathering.description.ar,
  descriptionEn: gathering.description.en,
  type: gathering.type,
  date: gathering.date,
  startTime: gathering.startTime,
  endTime: gathering.endTime ?? "",
  venueNameAr: gathering.venue.name.ar,
  venueNameEn: gathering.venue.name.en,
  address: gathering.venue.address,
  latitude: String(gathering.venue.latitude),
  longitude: String(gathering.venue.longitude),
  speakerId: gathering.speakerId ?? "",
  livestreamUrl: gathering.livestreamUrl ?? "",
  attendance: gathering.attendance,
  active: gathering.active,
});

/** An empty number input is missing, not 0 as `Number("")` would make it. */
const toNumber = (text: string): number =>
  text.trim() === "" ? Number.NaN : Number(text);

const toOptional = (text: string): string | null =>
  text.trim() === "" ? null : text.trim();

const describeIssue = (issue: z.core.$ZodIssue): string => {
  if (issue.code === "too_small" && issue.origin === "string") {
    return "Required";
  }
  if (issue.code === "invalid_type" && issue.expected === "number") {
    return "Enter a number";
  }
  if (issue.code === "too_small" || issue.code === "too_big") {
    return "Out of range";
  }
  if (issue.code === "invalid_format" && issue.format === "url") {
    return "Enter a full http(s) link";
  }
  if (issue.code === "invalid_format" && issue.format === "regex") {
    return "Required";
  }
  return issue.message;
};

const validate = <S extends z.ZodType>(
  schema: S,
  value: unknown
): Validated<z.output<S>> => {
  const result = schema.safeParse(value);
  if (result.success) {
    return { ok: true, draft: result.data };
  }
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    errors[path] ??= describeIssue(issue);
  }
  return { ok: false, errors };
};

/** The form as the contract's draft, or the errors to show by its fields. */
export const validateGatheringForm = (
  form: GatheringForm
): Validated<GatheringDraft> =>
  validate(gatheringDraftSchema, {
    ...(form.id === null ? {} : { id: form.id }),
    title: { ar: form.titleAr, en: form.titleEn },
    description: { ar: form.descriptionAr, en: form.descriptionEn },
    type: form.type,
    date: form.date,
    startTime: form.startTime,
    endTime: toOptional(form.endTime),
    venue: {
      name: { ar: form.venueNameAr, en: form.venueNameEn },
      address: form.address,
      latitude: toNumber(form.latitude),
      longitude: toNumber(form.longitude),
    },
    speakerId: toOptional(form.speakerId),
    livestreamUrl: toOptional(form.livestreamUrl),
    attendance: form.attendance,
    active: form.active,
  });

/** A Speaker as its form holds it. */
export interface SpeakerForm {
  id: string | null;
  nameAr: string;
  nameEn: string;
  photoKey: string | null;
}

export const speakerToForm = (speaker: Speaker | null): SpeakerForm =>
  speaker
    ? {
        id: speaker.id,
        nameAr: speaker.name.ar,
        nameEn: speaker.name.en,
        photoKey: speaker.photoKey,
      }
    : { id: null, nameAr: "", nameEn: "", photoKey: null };

export const validateSpeakerForm = (
  form: SpeakerForm
): Validated<SpeakerDraft> =>
  validate(speakerDraftSchema, {
    ...(form.id === null ? {} : { id: form.id }),
    name: { ar: form.nameAr, en: form.nameEn },
    photoKey: form.photoKey,
  });
