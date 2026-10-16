import { describe, expect, it } from "vitest";

import { MOODS } from "./moods";
import { pickRemedy, REMEDIES, remediesFor, remedyById } from "./remedies";

describe("remedies", () => {
  it("offers every mood at least one Remedy, written in Arabic and English", () => {
    for (const mood of MOODS) {
      const remedies = remediesFor(mood);

      expect(remedies.length).toBeGreaterThan(0);
      for (const remedy of remedies) {
        expect(remedy.mood).toBe(mood);
        const texts = remedy.source
          ? [remedy.text, remedy.source]
          : [remedy.text];
        for (const { ar, en } of texts) {
          expect(ar.trim()).not.toBe("");
          expect(en.trim()).not.toBe("");
        }
      }
    }
  });

  it("gives each Remedy its own id, so a saved Mood Check-in finds it again", () => {
    const ids = REMEDIES.map((remedy) => remedy.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const remedy of REMEDIES) {
      expect(remedyById(remedy.id)).toBe(remedy);
    }
    expect(remedyById("no-such-remedy")).toBeNull();
  });

  it("picks a Remedy for the mood, spread across all of its Remedies", () => {
    const sad = remediesFor("sad");

    expect(pickRemedy("sad", () => 0)).toBe(sad[0]);
    expect(pickRemedy("sad", () => 0.999999)).toBe(sad.at(-1));
    for (const mood of MOODS) {
      expect(pickRemedy(mood).mood).toBe(mood);
    }
  });
});
