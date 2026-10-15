import { recitationPlayback } from "@alrisali/domain/quran";
import type {
  RecitationEvent,
  RecitationPlayback,
} from "@alrisali/domain/quran";
import { describe, expect, it } from "vitest";

import { ayahCopyText, playFromAyah } from "./ayah-actions";
import { formatNumber } from "./format";

const idle: RecitationPlayback = { status: "idle" };

const run = (...events: RecitationEvent[]) => {
  let state: RecitationPlayback = idle;
  for (const event of events) {
    state = recitationPlayback(state, event);
  }
  return state;
};

describe(playFromAyah, () => {
  it("starts the queue at the long-pressed ayah", () => {
    expect(run(playFromAyah("2:255", "ar.alafasy"))).toStrictEqual({
      status: "loading",
      ayah: "2:255",
      reciter: "ar.alafasy",
      until: null,
    });
  });

  it("continues past that ayah once it finishes", () => {
    const state = run(
      playFromAyah("2:255", "ar.alafasy"),
      { type: "ready" },
      { type: "finished" }
    );
    expect(state).toMatchObject({ status: "loading", ayah: "2:256" });
  });

  it("replaces what is playing with the long-pressed ayah", () => {
    const state = run(
      { type: "play", ayah: "1:1", reciter: "ar.alafasy" },
      { type: "ready" },
      playFromAyah("36:1", "ar.alafasy")
    );
    expect(state).toMatchObject({ status: "loading", ayah: "36:1" });
  });
});

describe(ayahCopyText, () => {
  it("puts the surah:ayah reference under the text", () => {
    expect(
      ayahCopyText({
        text: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ",
        key: "2:255",
        surahName: "Al-Baqarah",
        language: "en",
      })
    ).toBe("ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ\n(Al-Baqarah 2:255)");
  });

  it("writes the reference in the UI language's digits", () => {
    expect(
      ayahCopyText({
        text: "ٱلْحَمْدُ لِلَّهِ",
        key: "1:2",
        surahName: "الفاتحة",
        language: "ar",
      })
    ).toBe(
      `ٱلْحَمْدُ لِلَّهِ\n(الفاتحة ${formatNumber("ar", 1)}:${formatNumber("ar", 2)})`
    );
  });
});
