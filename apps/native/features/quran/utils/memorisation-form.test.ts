import { playbackPlan } from "@alrisali/domain/quran";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_MEMORISATION_FORM,
  memorisationSettings,
} from "./memorisation-form";

describe(memorisationSettings, () => {
  it("asks for plain listening by default", () => {
    expect(
      playbackPlan(
        "1:1",
        undefined,
        memorisationSettings(DEFAULT_MEMORISATION_FORM)
      )
    ).toStrictEqual(playbackPlan("1:1"));
  });

  it("turns the chosen repeats, pause, speed and sleep timer into settings", () => {
    expect(
      memorisationSettings({
        ayahRepeat: "5",
        rangeRepeat: "infinite",
        pause: "ayahLength",
        seconds: "3",
        factor: "1.5",
        speed: "0.75",
        sleep: "minutes-30",
        askToContinueAtEnd: false,
      })
    ).toStrictEqual({
      ayahRepeat: 5,
      rangeRepeat: "infinite",
      pause: { kind: "ayahLength", factor: 1.5 },
      speed: 0.75,
      sleep: { kind: "minutes", minutes: 30 },
      askToContinueAtEnd: false,
    });
  });

  it("uses the seconds the Believer chose for a timed pause", () => {
    expect(
      memorisationSettings({
        ...DEFAULT_MEMORISATION_FORM,
        pause: "seconds",
        seconds: "10",
        sleep: "endOfSurah",
      })
    ).toMatchObject({
      pause: { kind: "seconds", seconds: 10 },
      sleep: { kind: "endOfSurah" },
    });
  });
});
