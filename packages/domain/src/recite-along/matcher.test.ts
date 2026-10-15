import { describe, expect, it } from "vitest";

import { createReciteMatcher, wordsMatch } from "./matcher";
import { tokenizeText } from "./normalize";

// Fixtures from the old app's verify-recite-matcher script.
const HAMD = "الْحَمْدُ لِلَّهِ الأَوَّلِ بِلا أَوَّلٍ كانَ قَبْلَهُ وَالآخِرِ بِلا آخِرٍ يَكُونُ بَعْدَهُ";
const FATIHA_OPENING = "الْحَمْدُ لِلَّهِ رَبِّ الْعالَمِينَ";

const matcherFor = (text: string) =>
  createReciteMatcher(tokenizeText(text).words);

describe("fuzzy word match", () => {
  it("matches the same word", () => {
    expect(wordsMatch("الحمد", "الحمد")).toBeTruthy();
  });

  it("tolerates a clipped ending", () => {
    expect(wordsMatch("العالمين", "العالمي")).toBeTruthy();
  });

  it("tolerates one edit on a long word", () => {
    expect(wordsMatch("الرحمن", "الرحمان")).toBeTruthy();
  });

  it("strips a prefix fused onto the heard word", () => {
    expect(wordsMatch("اللهم", "باللهم")).toBeTruthy();
    expect(wordsMatch("صل", "وصل")).toBeTruthy();
  });

  it("rejects a mismatched short word", () => {
    expect(wordsMatch("رب", "في")).toBeFalsy();
  });

  it("rejects an unrelated word", () => {
    expect(wordsMatch("الحمد", "السلام")).toBeFalsy();
  });

  it("never matches an empty word", () => {
    expect(wordsMatch("", "الحمد")).toBeFalsy();
  });
});

describe("Recite-Along matcher", () => {
  it("advances on an interim transcript and recomputes as it grows", () => {
    const matcher = matcherFor(HAMD);

    expect(matcher.feed("الحمد", false)).toBe(1);
    expect(matcher.feed("الحمد لله الاول", false)).toBe(3);
    expect(matcher.feed("الحمد لله الاول بلا اول", true)).toBe(5);
  });

  it("strips the right-to-left mark a speech transcript begins with", () => {
    const matcher = matcherFor(FATIHA_OPENING);

    expect(matcher.feed("\u200Fالحمد لله", true)).toBe(2);
  });

  it("skips a missed word by looking ahead", () => {
    const matcher = matcherFor(HAMD);
    matcher.feed("الحمد لله الاول بلا اول", true);

    expect(matcher.feed("قبله", true)).toBe(7);
  });

  it("looks ahead at most 8 words", () => {
    const text = "واحد اثنان ثلاثه اربعه خمسه سته سبعه ثمانيه تسعه عشره";

    expect(matcherFor(text).feed("ثمانيه", true)).toBe(8);
    expect(matcherFor(text).feed("تسعه", true)).toBe(0);
  });

  it("only moves forward", () => {
    const matcher = matcherFor(HAMD);
    matcher.feed("الحمد لله الاول بلا اول كان قبله", true);

    expect(matcher.feed("الحمد", true)).toBe(7);
    expect(matcher.position).toBe(7);
  });

  it("matches a short word glued onto the next", () => {
    expect(matcherFor("وَ الآخِرِ بِلا آخِرٍ").feed("والاخر", true)).toBe(2);
  });

  it("tolerates a one-edit slip", () => {
    expect(
      matcherFor("سُبْحانَ اللهِ الْعَظِيمِ").feed("سبحان الله العضيم", true)
    ).toBe(3);
  });

  it("matches words with a fused prefix", () => {
    expect(matcherFor("اللَّهُمَّ صَلِّ عَلى").feed("باللهم", true)).toBe(1);
    expect(matcherFor("صَلِّ عَلى مُحَمَّدٍ").feed("وصل على", true)).toBe(2);
  });

  it("resumes from a position placed by touch", () => {
    const matcher = matcherFor(FATIHA_OPENING);
    matcher.seek(2);

    expect(matcher.feed("رب العالمين", true)).toBe(4);
  });

  it("starts a new utterance from the position when sealed", () => {
    const matcher = matcherFor(FATIHA_OPENING);
    matcher.feed("الحمد لله", false);
    matcher.seal();

    expect(matcher.feed("رب", false)).toBe(3);
  });

  it("ignores replayed words behind a touch-placed position", () => {
    const matcher = matcherFor(HAMD);
    matcher.feed("الحمد لله", true);
    matcher.seek(4);

    expect(matcher.feed("الحمد لله", false)).toBe(4);
    expect(matcher.feed("كان قبله", true)).toBe(7);
  });

  it("starts over from the top only when restarted", () => {
    const matcher = matcherFor(FATIHA_OPENING);
    matcher.feed("الحمد لله رب", true);
    matcher.seek(0);

    expect(matcher.position).toBe(0);
    expect(matcher.feed("الحمد", false)).toBe(1);
    expect(matcher.feed("لله", false)).toBe(2);
  });
});
