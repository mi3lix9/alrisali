import type { ByMeaningDays } from "@alrisali/content/quran";
import {
  nextHijriOccurrence,
  planForDeadline,
  previewPlan,
  sessionsFor,
} from "@alrisali/domain/khatmah";
import type {
  AmountUnit,
  DeadlineResult,
  KhatmahPlan,
  KhatmahPreview,
  SessionInterval,
} from "@alrisali/domain/khatmah";
import type { HijriMonth } from "@alrisali/domain/shared";
import { useState } from "react";
import type { Temporal } from "temporal-polyfill";

import { useHijriCalendar } from "@/shared/lib/hijri-calendar";
import { useToday } from "@/shared/lib/today";

import type { DeadlineCalendar } from "../components/deadline-field";

export type PlanChoice =
  | "suggested"
  | "even"
  | "meaning"
  | "amount"
  | "deadline";

/** What the Believer has picked on the new-Khatmah screen. */
export interface PlanDraft {
  choice: PlanChoice;
  days: number;
  meaning: ByMeaningDays;
  amount: { unit: AmountUnit; count: number };
  deadlineCalendar: DeadlineCalendar;
  deadlineDate: Temporal.PlainDate;
  deadlineHijri: { month: HijriMonth; day: number };
  every: SessionInterval;
  join: number;
}

const DEFAULT_DEADLINE_DAYS = 30;
const DEFAULT_DEADLINE_HIJRI = { month: 9, day: 29 } as const;
/** A deadline sooner than this cannot make three sessions. */
const EARLIEST_DEADLINE_DAYS = 2;

/** The plan a draft stands for, before any join. */
const basePlan = (draft: PlanDraft): KhatmahPlan => {
  const schedule = draft.every === 1 ? {} : { every: draft.every };
  switch (draft.choice) {
    case "even": {
      return { kind: "even", days: draft.days, ...schedule };
    }
    case "meaning": {
      return { kind: "meaning", days: draft.meaning, ...schedule };
    }
    case "amount": {
      return { kind: "amount", ...draft.amount, ...schedule };
    }
    default: {
      return { kind: "suggested", ...schedule };
    }
  }
};

export interface PlanDraftState {
  draft: PlanDraft;
  update: (changes: Partial<PlanDraft>) => void;
  /** The plan to start; null while a deadline cannot be met. */
  plan: KhatmahPlan | null;
  /** Sessions the plan has before any join; null for a deadline plan. */
  joinTotal: number | null;
  preview: KhatmahPreview | null;
  /** The day a by-deadline plan finishes, as picked. */
  deadline: Temporal.PlainDate;
  deadlineProblem: Extract<DeadlineResult, { ok: false }>["reason"] | null;
  /** The earliest day a deadline may be. */
  earliestDeadline: Temporal.PlainDate;
}

/** The state of the new-Khatmah form, and the plan and preview it gives. */
export const usePlanDraft = (): PlanDraftState => {
  const today = useToday();
  const calendar = useHijriCalendar();
  const [draft, setDraft] = useState<PlanDraft>({
    choice: "suggested",
    days: 60,
    meaning: 7,
    amount: { unit: "juz", count: 1 },
    deadlineCalendar: "hijri",
    deadlineDate: today.add({ days: DEFAULT_DEADLINE_DAYS }),
    deadlineHijri: DEFAULT_DEADLINE_HIJRI,
    every: 1,
    join: 1,
  });
  const update = (changes: Partial<PlanDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...changes };
      // A different plan has different sessions to join at.
      return changes.choice ||
        changes.days ||
        changes.meaning ||
        changes.amount ||
        changes.every
        ? { ...next, join: 1 }
        : next;
    });
  };

  const earliestDeadline = today.add({ days: EARLIEST_DEADLINE_DAYS });
  const deadline =
    draft.deadlineCalendar === "hijri"
      ? nextHijriOccurrence(calendar, today, draft.deadlineHijri)
      : draft.deadlineDate;

  let plan: KhatmahPlan | null = null;
  let joinTotal: number | null = null;
  let deadlineProblem: PlanDraftState["deadlineProblem"] = null;
  if (draft.choice === "deadline") {
    const result = planForDeadline({
      start: today,
      deadline,
      every: draft.every,
    });
    if (result.ok) {
      ({ plan } = result);
    } else {
      deadlineProblem = result.reason;
    }
  } else {
    const base = basePlan(draft);
    joinTotal = sessionsFor(base).length;
    plan = draft.join > 1 ? { ...base, from: draft.join } : base;
  }

  return {
    draft,
    update,
    plan,
    joinTotal,
    preview: plan ? previewPlan(plan, today) : null,
    deadline,
    deadlineProblem,
    earliestDeadline,
  };
};
