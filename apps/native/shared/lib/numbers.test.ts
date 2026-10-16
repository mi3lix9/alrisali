import type { Digits } from "@alrisali/domain/shared";
import type { Language } from "@alrisali/i18n";
import { Temporal } from "temporal-polyfill";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  digitsFor,
  formatDateTime,
  formatNumber,
  localizeDigits,
  parseNumber,
} from "./numbers";

// The launch language and the Believer's digits, as preferences.ts would
// read them from the device.
const shell = vi.hoisted(() => ({
  language: "ar" as Language,
  digits: "arabic-indic" as Digits,
}));

vi.mock(import("./preferences"), () => ({
  get launchLanguage() {
    return shell.language;
  },
  usePreferences: Object.assign(() => shell.digits, {
    getState: () => ({ digits: shell.digits }),
  }) as never,
}));

const as = (language: Language, digits: Digits) => {
  shell.language = language;
  shell.digits = digits;
};

describe(digitsFor, () => {
  it("follows the Believer's choice in Arabic, and is Western in English", () => {
    expect(digitsFor("ar", "arabic-indic")).toBe("arabic-indic");
    expect(digitsFor("ar", "latin")).toBe("latin");
    expect(digitsFor("en", "arabic-indic")).toBe("latin");
  });
});

describe(formatNumber, () => {
  beforeEach(() => as("ar", "arabic-indic"));

  it("writes Arabic-Indic digits in Arabic by default", () => {
    expect(formatNumber(1234.5)).toBe("١٬٢٣٤٫٥");
    expect(localizeDigits("2:255")).toBe("٢:٢٥٥");
  });

  it("writes Western digits in Arabic when the Believer picks them", () => {
    as("ar", "latin");

    expect(formatNumber(1234.5)).toBe("1,234.5");
    expect(localizeDigits("٢:٢٥٥")).toBe("2:255");
  });

  it("always writes Western digits in English", () => {
    as("en", "arabic-indic");

    expect(formatNumber(1234.5)).toBe("1,234.5");
    expect(formatNumber(0.5, { style: "percent" })).toBe("50%");
  });
});

describe(formatDateTime, () => {
  const time = Temporal.PlainTime.from("07:05");

  it("writes times and dates in the interface's digits", () => {
    as("ar", "arabic-indic");
    expect(
      formatDateTime(time, { hour: "numeric", minute: "2-digit" })
    ).toMatch(/^٧:٠٥/u);

    as("ar", "latin");
    expect(
      formatDateTime(time, { hour: "numeric", minute: "2-digit" })
    ).toMatch(/^7:05/u);

    as("en", "arabic-indic");
    expect(
      formatDateTime(new Date(Date.UTC(2026, 9, 16)), {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    ).toBe("October 16, 2026");
  });
});

describe(parseNumber, () => {
  it("reads typed text in either digits", () => {
    expect(parseNumber("١٠")).toBe(10);
    expect(parseNumber("10")).toBe(10);
  });

  it("is NaN for text that is no number", () => {
    expect(parseNumber("")).toBeNaN();
    expect(parseNumber("ten")).toBeNaN();
  });
});
