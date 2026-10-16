import {
  EMPTY_BILINGUAL_TEXT,
  officialProgramSchema,
} from "@alrisali/domain/programs";
import type {
  Act,
  ActInput,
  ActSchedule,
  ActType,
  BilingualText,
  OfficialProgram,
  OfficialProgramInput,
  ProgramCategory,
  SalahTiming,
  SunnahPrayerPresetKey,
} from "@alrisali/domain/programs";
import type { HijriMonthDay, Salah } from "@alrisali/domain/shared";

/**
 * A Program being edited. It keeps every type's and schedule's fields, so
 * switching back and forth loses nothing; only the chosen ones are saved.
 */
export interface ProgramDraft {
  id: string;
  name: BilingualText;
  description: BilingualText;
  active: boolean;
  category: ProgramCategory;
  window: { start: HijriMonthDay; end: HijriMonthDay };
  acts: ActDraft[];
}

export interface ActDraft {
  id: string;
  name: BilingualText;
  description: BilingualText;
  scheduleKind: ActSchedule["kind"];
  weekdays: number[];
  /** YYYY-MM-DD, for a one-off Act. */
  date: string;
  /** The Salah it is tied to; null for none. */
  salah: Salah | null;
  timing: SalahTiming;
  type: ActType;
  dua: {
    arabic: string;
    transliteration: string;
    translation: string;
    instructions: BilingualText;
    /** Blank for no recitation. */
    audioUrl: string;
  };
  prayer: {
    preset: SunnahPrayerPresetKey | null;
    rakahs: number;
    steps: BilingualText;
    adhkar: BilingualText;
    requiresWudu: boolean;
  };
}

const DEFAULT_WINDOW = {
  start: { month: 9, day: 1 },
  end: { month: 9, day: 30 },
} as const satisfies ProgramDraft["window"];

const DEFAULT_RAKAHS = 2;

export const emptyActDraft = (): ActDraft => ({
  id: crypto.randomUUID(),
  name: EMPTY_BILINGUAL_TEXT,
  description: EMPTY_BILINGUAL_TEXT,
  scheduleKind: "daily",
  weekdays: [],
  date: "",
  salah: null,
  timing: "before",
  type: "regular",
  dua: {
    arabic: "",
    transliteration: "",
    translation: "",
    instructions: EMPTY_BILINGUAL_TEXT,
    audioUrl: "",
  },
  prayer: {
    preset: null,
    rakahs: DEFAULT_RAKAHS,
    steps: EMPTY_BILINGUAL_TEXT,
    adhkar: EMPTY_BILINGUAL_TEXT,
    requiresWudu: true,
  },
});

export const emptyProgramDraft = (): ProgramDraft => ({
  id: crypto.randomUUID(),
  name: EMPTY_BILINGUAL_TEXT,
  description: EMPTY_BILINGUAL_TEXT,
  active: true,
  category: "general",
  window: DEFAULT_WINDOW,
  acts: [],
});

const actToDraft = (act: Act): ActDraft => {
  const draft: ActDraft = {
    ...emptyActDraft(),
    id: act.id,
    name: act.name,
    description: act.description,
    scheduleKind: act.schedule.kind,
    salah: act.salah?.salah ?? null,
    timing: act.salah?.timing ?? "before",
    type: act.detail.type,
  };
  if (act.schedule.kind === "weekdays") {
    draft.weekdays = act.schedule.weekdays;
  }
  if (act.schedule.kind === "once") {
    draft.date = act.schedule.date;
  }
  if (act.detail.type === "dua") {
    const { type: _type, audioUrl, ...dua } = act.detail;
    draft.dua = { ...dua, audioUrl: audioUrl ?? "" };
  }
  if (act.detail.type === "prayer") {
    const { type: _type, ...prayer } = act.detail;
    draft.prayer = prayer;
  }
  return draft;
};

export const programToDraft = (program: OfficialProgram): ProgramDraft => ({
  id: program.id,
  name: program.name,
  description: program.description,
  active: program.active,
  category: program.category,
  window: program.category === "seasonal" ? program.window : DEFAULT_WINDOW,
  acts: program.acts.map(actToDraft),
});

const draftSchedule = (draft: ActDraft): ActInput["schedule"] => {
  switch (draft.scheduleKind) {
    case "weekdays": {
      return { kind: "weekdays", weekdays: draft.weekdays };
    }
    case "once": {
      return { kind: "once", date: draft.date };
    }
    default: {
      return { kind: "daily" };
    }
  }
};

const draftDetail = (draft: ActDraft): ActInput["detail"] => {
  switch (draft.type) {
    case "dua": {
      const audioUrl = draft.dua.audioUrl.trim();
      return {
        type: "dua",
        ...draft.dua,
        audioUrl: audioUrl === "" ? null : audioUrl,
      };
    }
    case "prayer": {
      return { type: "prayer", ...draft.prayer };
    }
    default: {
      return { type: "regular" };
    }
  }
};

const draftToAct = (draft: ActDraft): ActInput => ({
  id: draft.id,
  name: draft.name,
  description: draft.description,
  schedule: draftSchedule(draft),
  salah: draft.salah ? { salah: draft.salah, timing: draft.timing } : null,
  detail: draftDetail(draft),
});

const draftToInput = (draft: ProgramDraft): OfficialProgramInput => {
  const fields = {
    id: draft.id,
    name: draft.name,
    description: draft.description,
    active: draft.active,
    acts: draft.acts.map(draftToAct),
  };
  return draft.category === "seasonal"
    ? { ...fields, category: "seasonal", window: draft.window }
    : { ...fields, category: "general" };
};

/** Field errors keyed by their path in the Program, like `acts.0.name.ar`. */
export type FieldErrors = Readonly<Record<string, string>>;

export type DraftValidation =
  | { ok: true; program: OfficialProgram }
  | { ok: false; errors: FieldErrors };

/** Checks a draft with the same schema the server uses. */
export const validateDraft = (draft: ProgramDraft): DraftValidation => {
  const result = officialProgramSchema.safeParse(draftToInput(draft));
  if (result.success) {
    return { ok: true, program: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.map(String).join(".");
    errors[path] ??= issue.message;
  }
  return { ok: false, errors };
};

/** The errors under one path, re-keyed relative to it. */
export const errorsUnder = (errors: FieldErrors, prefix: string): FieldErrors =>
  Object.fromEntries(
    Object.entries(errors)
      .filter(([path]) => path.startsWith(`${prefix}.`))
      .map(([path, message]) => [path.slice(prefix.length + 1), message])
  );
