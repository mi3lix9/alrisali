import { describe, expect, it } from "vitest";

import {
  advanceOnboarding,
  FIRST_RUN,
  ONBOARDING_STEPS,
  previousOnboardingStep,
  readOnboardingProgress,
  stepPosition,
} from "./onboarding";

describe("the first-run flow", () => {
  it("asks language, location, Calculation Method, Message Style, notifications, then the account", () => {
    expect(ONBOARDING_STEPS).toStrictEqual([
      "language",
      "location",
      "calculationMethod",
      "messageStyle",
      "notifications",
      "account",
    ]);
  });

  it("starts at the language", () => {
    expect(FIRST_RUN).toStrictEqual({ done: false, step: "language" });
  });
});

describe(advanceOnboarding, () => {
  it("moves to the next step", () => {
    expect(advanceOnboarding("language")).toStrictEqual({
      done: false,
      step: "location",
    });
    expect(advanceOnboarding("messageStyle")).toStrictEqual({
      done: false,
      step: "notifications",
    });
  });

  it("finishes after the account step, whether the Believer signed in or continued as a Guest", () => {
    expect(advanceOnboarding("account")).toStrictEqual({ done: true });
  });
});

describe(previousOnboardingStep, () => {
  it("goes back one step", () => {
    expect(previousOnboardingStep("location")).toBe("language");
    expect(previousOnboardingStep("account")).toBe("notifications");
  });

  it("has nothing before the language", () => {
    expect(previousOnboardingStep("language")).toBeNull();
  });
});

describe(stepPosition, () => {
  it("counts from one, out of every step", () => {
    expect(stepPosition("language")).toStrictEqual({ number: 1, of: 6 });
    expect(stepPosition("account")).toStrictEqual({ number: 6, of: 6 });
  });
});

describe(readOnboardingProgress, () => {
  it("reads a finished flow", () => {
    expect(readOnboardingProgress('{"done":true}')).toStrictEqual({
      done: true,
    });
  });

  it("resumes where the Believer left off (a language change relaunches the app)", () => {
    expect(
      readOnboardingProgress('{"done":false,"step":"location"}')
    ).toStrictEqual({ done: false, step: "location" });
  });

  it("starts over when nothing is stored", () => {
    expect(readOnboardingProgress(null)).toStrictEqual(FIRST_RUN);
  });

  it("starts over on anything it cannot read", () => {
    expect(readOnboardingProgress("not json")).toStrictEqual(FIRST_RUN);
    expect(
      readOnboardingProgress('{"done":false,"step":"gone"}')
    ).toStrictEqual(FIRST_RUN);
    expect(readOnboardingProgress("[]")).toStrictEqual(FIRST_RUN);
  });
});
