import { z } from "zod";

/**
 * The first-run flow, in order. Every step but the account opens on a
 * sensible default, so a Believer who agrees taps Continue through it.
 */
export const ONBOARDING_STEPS = [
  "language",
  "location",
  "calculationMethod",
  "messageStyle",
  "notifications",
  "account",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Where the first run stands on this device. */
export type OnboardingProgress =
  | { done: false; step: OnboardingStep }
  | { done: true };

export const FIRST_RUN: OnboardingProgress = { done: false, step: "language" };

const DONE: OnboardingProgress = { done: true };

/** The step after `step`, or done after the account. */
export const advanceOnboarding = (step: OnboardingStep): OnboardingProgress => {
  const next = ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) + 1];
  return next ? { done: false, step: next } : DONE;
};

/** The step before `step`, or null on the first. */
export const previousOnboardingStep = (
  step: OnboardingStep
): OnboardingStep | null =>
  ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) - 1] ?? null;

/** "Step `number` of `of`", counted from one. */
export const stepPosition = (
  step: OnboardingStep
): { number: number; of: number } => ({
  number: ONBOARDING_STEPS.indexOf(step) + 1,
  of: ONBOARDING_STEPS.length,
});

const progressSchema = z.discriminatedUnion("done", [
  z.object({ done: z.literal(true) }),
  z.object({ done: z.literal(false), step: z.enum(ONBOARDING_STEPS) }),
]);

/**
 * Reads the stored progress (JSON text, or null when nothing is stored).
 * Anything unreadable starts the flow over.
 */
export const readOnboardingProgress = (
  raw: string | null
): OnboardingProgress => {
  if (raw === null) {
    return FIRST_RUN;
  }
  try {
    const parsed = progressSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : FIRST_RUN;
  } catch {
    return FIRST_RUN;
  }
};
