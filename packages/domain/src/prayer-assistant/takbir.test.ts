import { describe, expect, it } from "vitest";

import { completesAt, currentStep, observe, startSalah } from "./rakah-machine";
import type { AssistantState } from "./rakah-machine";
import { SALAH_DEFINITIONS } from "./salah-definition";
import { countTakbirs, createTakbirDetector, TAKBIR_REPEAT_MS } from "./takbir";

describe(countTakbirs, () => {
  it.each([
    "الله أكبر",
    "الله اكبر",
    "اللَّهُ أَكْبَرُ",
    "الله أكـبر",
    "أكبر",
    "Allahu Akbar",
    "allah akbar",
    "Allahu Akhbar",
  ])("hears Allahu Akbar however the recogniser spells it: %s", (heard) => {
    expect(countTakbirs(heard)).toBe(1);
  });

  it.each([
    ["\u200Fالله أكبر", 1],
    ["الله \u200Fأكبر", 1],
    ["الله أك\u200Fبر", 1],
    ["\u200Fالله \u200Fأكبر \u200Fالله \u200Fأكبر", 2],
    ["\u200F", 0],
  ])(
    "ignores the right-to-left marks (U+200F) iOS puts in %j",
    (heard, takbirs) => {
      expect(countTakbirs(heard)).toBe(takbirs);
    }
  );

  it.each([
    "سمع الله لمن حمده",
    "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ",
    "\u200Fسمع الله لمن حمده",
    "Sami Allahu liman hamidah",
  ])(
    "hears Sami' Allahu liman hamidah, said rising from Ruku instead of a Takbir: %j",
    (heard) => {
      expect(countTakbirs(heard)).toBe(1);
    }
  );

  it("counts each Takbir in a transcript that holds several", () => {
    expect(countTakbirs("الله أكبر الله أكبر")).toBe(2);
    expect(countTakbirs("الله أكبر سمع الله لمن حمده الله أكبر")).toBe(3);
  });

  it.each([
    "",
    "الحمد لله رب العالمين",
    "بسم الله الرحمن الرحيم",
    "ربنا ولك الحمد",
    "سبحان ربي العظيم",
  ])("hears nothing in the rest of the recitation: %j", (heard) => {
    expect(countTakbirs(heard)).toBe(0);
  });
});

describe(createTakbirDetector, () => {
  it("takes the first Takbir as the opening one, then moves one step per Takbir", () => {
    const detector = createTakbirDetector();
    expect(detector.feed("الله", false, 0)).toBe(0);
    expect(detector.opened).toBeFalsy();
    expect(detector.feed("\u200Fالله أكبر", true, 100)).toBe(0);
    expect(detector.opened).toBeTruthy();
    detector.seal();
    expect(detector.feed("\u200Fالله أكبر", true, 5000)).toBe(1);
  });

  it("counts a Takbir once while interim transcripts of it grow and get revised", () => {
    const detector = createTakbirDetector();
    detector.open();
    const transcripts = [
      ["الله أكبر", 0],
      ["الله أكبر", 100],
      ["الله", 200],
      ["الله أكبر", 300],
      ["الله أكبر الله", 2000],
    ] as const;
    expect(
      transcripts.map(([heard, at]) => detector.feed(heard, false, at))
    ).toStrictEqual([1, 0, 0, 0, 0]);
    expect(detector.feed("الله أكبر الله أكبر", true, 2500)).toBe(1);
  });

  it("starts counting afresh in the next utterance", () => {
    const detector = createTakbirDetector();
    detector.open();
    expect(detector.feed("الله أكبر", false, 0)).toBe(1);
    detector.seal();
    expect(detector.feed("الله أكبر", false, 3000)).toBe(1);
    expect(detector.feed("الله أكبر", true, 3100)).toBe(0);
    expect(detector.feed("الله أكبر", false, 6000)).toBe(1);
  });

  it("drops a Takbir a new utterance repeats right after the last one", () => {
    const detector = createTakbirDetector();
    detector.open();
    expect(detector.feed("الله أكبر", true, 1000)).toBe(1);
    expect(detector.feed("الله أكبر", false, 1000 + TAKBIR_REPEAT_MS - 1)).toBe(
      0
    );
    detector.seal();
    expect(detector.feed("الله أكبر", false, 1000 + TAKBIR_REPEAT_MS)).toBe(1);
  });

  it("follows a whole Fajr from recorded transcripts", () => {
    // iOS: interim transcripts grow, each begins with U+200F, a final one
    // closes the utterance and the session restarts.
    const takbir = [
      "\u200Fالله",
      "\u200Fالله أكبر",
      "\u200Fالله أكبر",
    ] as const;
    const tasmi = [
      "\u200Fسمع",
      "\u200Fسمع الله",
      "\u200Fسمع الله لمن حمده",
      "\u200Fسمع الله لمن حمده ربنا ولك الحمد",
    ] as const;
    const recitation = ["\u200Fالحمد", "\u200Fالحمد لله رب العالمين"] as const;
    const rakah = [recitation, takbir, tasmi, takbir, takbir, takbir, takbir];
    const utterances = [takbir, ...rakah, ...rakah];

    const detector = createTakbirDetector();
    let state: AssistantState = startSalah(SALAH_DEFINITIONS.fajr, {
      pace: "normal",
    });
    let at = 0;
    for (const utterance of utterances) {
      for (const [index, transcript] of utterance.entries()) {
        at += 400;
        const steps = detector.feed(
          transcript,
          index === utterance.length - 1,
          at
        );
        for (let step = 0; step < steps; step += 1) {
          state = observe(state, { kind: "advance", at });
        }
      }
      detector.seal();
      at += 1500;
    }

    expect(currentStep(state)).toStrictEqual({
      rakah: 2,
      position: "tashahhud",
      final: true,
    });
    const due = completesAt(state) ?? Number.NaN;
    expect(observe(state, { kind: "tick", at: due }).completed).toBeTruthy();
  });
});
