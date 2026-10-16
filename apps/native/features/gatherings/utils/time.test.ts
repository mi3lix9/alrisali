import type { Digits } from "@alrisali/domain/shared";
import type { Language } from "@alrisali/i18n";
import { describe, expect, it, vi } from "vitest";

import { formatTimeRange } from "./time";

const shell = vi.hoisted(() => ({
  language: "en" as Language,
  digits: "arabic-indic" as Digits,
}));

vi.mock(import("@/shared/lib/preferences"), () => ({
  get launchLanguage() {
    return shell.language;
  },
  usePreferences: Object.assign(() => shell.digits, {
    getState: () => ({ digits: shell.digits }),
  }) as never,
}));

describe(formatTimeRange, () => {
  it("writes the start and end in the language", () => {
    shell.language = "en";

    expect(formatTimeRange({ startTime: "19:30", endTime: "21:00" })).toMatch(
      /^7:30\sPM – 9:00\sPM$/u
    );
  });

  it("writes only the start without an end time", () => {
    shell.language = "en";

    expect(formatTimeRange({ startTime: "08:05", endTime: null })).toMatch(
      /^8:05\sAM$/u
    );
  });

  it("follows the Believer's digits in Arabic", () => {
    shell.language = "ar";
    shell.digits = "arabic-indic";
    expect(formatTimeRange({ startTime: "19:30", endTime: null })).toContain(
      "٧:٣٠"
    );

    shell.digits = "latin";
    expect(formatTimeRange({ startTime: "19:30", endTime: null })).toContain(
      "7:30"
    );
  });
});
