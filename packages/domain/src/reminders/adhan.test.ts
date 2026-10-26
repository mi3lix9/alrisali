import { describe, expect, it } from "vitest";

import { ADHAN_IDS, ADHANS, DEFAULT_ADHAN, adhanOf, takbeerOf } from "./adhan";
import { DEFAULT_REMINDER_SETTINGS, readReminderRule } from "./settings";

describe("Adhan catalog", () => {
  it("describes every id once, in order", () => {
    expect(ADHANS.map((adhan) => adhan.id)).toStrictEqual([...ADHAN_IDS]);
  });

  it("starts the default on a takbeer, which any device can play", () => {
    expect(adhanOf(DEFAULT_ADHAN).form).toBe("takbeer");
  });

  it("falls back to the same muezzin's takbeer", () => {
    expect(takbeerOf("sobhdel-full")).toBe("sobhdel-takbeer");
    expect(takbeerOf("hatamzadeh-takbeer")).toBe("hatamzadeh-takbeer");
  });

  it("gives every full recording a takbeer from the same muezzin", () => {
    for (const adhan of ADHANS) {
      expect(adhanOf(takbeerOf(adhan.id)).muezzin).toBe(adhan.muezzin);
    }
  });
});

describe("stored Adhan choice", () => {
  const fallback = DEFAULT_REMINDER_SETTINGS.salah.fajr;

  it("keeps a rule saved before the Adhan choice existed", () => {
    expect(
      readReminderRule(
        { enabled: true, minutesBefore: 3, voice: true },
        fallback
      )
    ).toStrictEqual({
      ...fallback,
      enabled: true,
      minutesBefore: 3,
      voice: true,
      adhan: DEFAULT_ADHAN,
    });
  });

  it("reads a known Adhan and ignores an unknown one", () => {
    expect(readReminderRule({ adhan: "sobhdel-full" }, fallback).adhan).toBe(
      "sobhdel-full"
    );
    expect(readReminderRule({ adhan: "gone" }, fallback).adhan).toBe(
      DEFAULT_ADHAN
    );
  });
});
