import { describe, expect, it } from "vitest";

import { playbackPlan, recitationPlayback } from ".";
import type { AyahKey, PlaybackSettings, PlayTo, RecitationPlayback } from ".";

const START = 1_000_000;

/** Plays `from` to `to`; `fed` runs ready + finished until it has fed enough. */
const begin = (
  from: AyahKey,
  to: PlayTo,
  settings: PlaybackSettings = {}
): RecitationPlayback =>
  recitationPlayback(
    { status: "idle" },
    {
      type: "play",
      ayah: from,
      reciter: "ar.alafasy",
      to,
      settings,
      now: START,
    }
  );

/** Every ayah the plan recites, in order, with `durationSeconds` per ayah. */
const sequence = (
  from: AyahKey,
  to: PlayTo,
  settings: PlaybackSettings,
  limit = 200
) => {
  let state = begin(from, to, settings);
  const heard: string[] = [];
  while (state.status !== "idle" && heard.length < limit) {
    if (state.status === "awaiting-continue") {
      break;
    }
    heard.push(state.ayah);
    state = recitationPlayback(state, { type: "ready" });
    state = recitationPlayback(state, {
      type: "finished",
      durationSeconds: 4,
    });
    if (state.status === "pausing") {
      state = recitationPlayback(state, { type: "pauseElapsed" });
    }
  }
  return { heard, last: state };
};

const noPrompt = { askToContinueAtEnd: false };

/** Ready, then finished a 6 s ayah, at the start of Al-Fatihah played to its end. */
const finished = (settings: PlaybackSettings, durationSeconds = 6) =>
  recitationPlayback(
    recitationPlayback(begin("1:1", { kind: "surah" }, settings), {
      type: "ready",
    }),
    { type: "finished", durationSeconds }
  );

/** Where a plan from `from` leaves recitation once its range has been recited. */
const atEnd = (to: PlayTo, from: AyahKey = "1:5") =>
  sequence(from, to, {}).last;

describe(recitationPlayback, () => {
  describe("ayah repeat", () => {
    it("recites each ayah of the range that many times before the next", () => {
      const { heard, last } = sequence(
        "1:5",
        { kind: "ayah", ayah: "1:7" },
        { ...noPrompt, ayahRepeat: 2 }
      );
      expect(heard).toStrictEqual(["1:5", "1:5", "1:6", "1:6", "1:7", "1:7"]);
      expect(last).toStrictEqual({ status: "idle" });
    });

    it("recites a single ayah five times", () => {
      const { heard } = sequence(
        "2:255",
        { kind: "ayah", ayah: "2:255" },
        { ...noPrompt, ayahRepeat: 5 }
      );
      expect(heard).toStrictEqual(Array.from({ length: 5 }, () => "2:255"));
    });

    it("never stops repeating when set to infinite, until stopped", () => {
      const { heard, last } = sequence(
        "1:1",
        { kind: "ayah", ayah: "1:2" },
        { ...noPrompt, ayahRepeat: "infinite" },
        50
      );
      expect(heard).toHaveLength(50);
      expect(heard.every((ayah) => ayah === "1:1")).toBeTruthy();
      expect(recitationPlayback(last, { type: "stop" })).toStrictEqual({
        status: "idle",
      });
    });
  });

  describe("range repeat", () => {
    it("recites the whole range again that many times", () => {
      const { heard } = sequence(
        "1:6",
        { kind: "ayah", ayah: "1:7" },
        { ...noPrompt, rangeRepeat: 3 }
      );
      expect(heard).toStrictEqual(["1:6", "1:7", "1:6", "1:7", "1:6", "1:7"]);
    });

    it("multiplies with the ayah repeat: ayah × range", () => {
      const { heard } = sequence(
        "112:1",
        { kind: "ayah", ayah: "112:2" },
        { ...noPrompt, ayahRepeat: 2, rangeRepeat: 2 }
      );
      expect(heard).toStrictEqual([
        "112:1",
        "112:1",
        "112:2",
        "112:2",
        "112:1",
        "112:1",
        "112:2",
        "112:2",
      ]);
    });

    it("repeats the last six ayat of the Quran from 114:1 to the end", () => {
      const { heard } = sequence(
        "114:5",
        { kind: "quran" },
        { ...noPrompt, rangeRepeat: 2 }
      );
      expect(heard).toStrictEqual(["114:5", "114:6", "114:5", "114:6"]);
    });

    it("plays 1:1 once and stops when nothing is repeated", () => {
      const { heard, last } = sequence(
        "1:1",
        { kind: "ayah", ayah: "1:1" },
        noPrompt
      );
      expect(heard).toStrictEqual(["1:1"]);
      expect(last).toStrictEqual({ status: "idle" });
    });
  });

  describe("pause after each ayah", () => {
    it("goes straight to the next ayah when there is no pause", () => {
      expect(finished({})).toMatchObject({ status: "loading", ayah: "1:2" });
    });

    it("waits the chosen seconds, then loads the next ayah", () => {
      const pausing = finished({ pause: { kind: "seconds", seconds: 3 } });
      expect(pausing).toMatchObject({
        status: "pausing",
        ayah: "1:2",
        pauseSeconds: 3,
      });
      expect(
        recitationPlayback(pausing, { type: "pauseElapsed" })
      ).toMatchObject({ status: "loading", ayah: "1:2", pauseSeconds: null });
    });

    it.each([
      [0.5, 3],
      [1, 6],
      [1.5, 9],
      [2, 12],
    ] as const)(
      "waits %s× the ayah's length (a 6 s ayah waits %s s)",
      (factor, seconds) => {
        expect(
          finished({ pause: { kind: "ayahLength", factor } })
        ).toMatchObject({ status: "pausing", pauseSeconds: seconds });
      }
    );

    it("pauses between repeats of the same ayah too", () => {
      const state = finished({
        ayahRepeat: 2,
        pause: { kind: "seconds", seconds: 2 },
      });
      expect(state).toMatchObject({
        status: "pausing",
        ayah: "1:1",
        ayahPass: 2,
      });
    });

    it("does not pause after the last ayah of the range", () => {
      const state = recitationPlayback(
        recitationPlayback(
          begin(
            "1:1",
            { kind: "ayah", ayah: "1:1" },
            { ...noPrompt, pause: { kind: "seconds", seconds: 3 } }
          ),
          { type: "ready" }
        ),
        { type: "finished", durationSeconds: 5 }
      );
      expect(state).toStrictEqual({ status: "idle" });
    });

    it("holds the silence while paused, and resumes it", () => {
      const pausing = finished({ pause: { kind: "seconds", seconds: 3 } });
      const paused = recitationPlayback(pausing, { type: "pause" });
      expect(paused).toMatchObject({ status: "paused", pauseSeconds: 3 });
      expect(recitationPlayback(paused, { type: "resume" })).toMatchObject({
        status: "pausing",
        ayah: "1:2",
      });
    });

    it("skips the rest of the silence when the Believer skips ahead", () => {
      const pausing = finished({ pause: { kind: "seconds", seconds: 3 } });
      expect(
        recitationPlayback(pausing, { type: "skip", direction: "next" })
      ).toMatchObject({ status: "loading", ayah: "1:3", pauseSeconds: null });
    });
  });

  describe("sleep timer", () => {
    it.each([15, 30, 60] as const)(
      "stops recitation %s minutes after it began",
      (minutes) => {
        const state = begin(
          "2:1",
          { kind: "quran" },
          { sleep: { kind: "minutes", minutes } }
        );
        expect(state).toMatchObject({ sleepAt: START + minutes * 60_000 });
        const before = recitationPlayback(state, {
          type: "tick",
          now: START + minutes * 60_000 - 1,
        });
        expect(before).toBe(state);
        expect(
          recitationPlayback(state, {
            type: "tick",
            now: START + minutes * 60_000,
          })
        ).toStrictEqual({ status: "idle" });
      }
    );

    it("keeps counting while paused or in silence", () => {
      const paused = recitationPlayback(
        begin(
          "2:1",
          { kind: "quran" },
          { sleep: { kind: "minutes", minutes: 15 } }
        ),
        { type: "pause" }
      );
      expect(
        recitationPlayback(paused, { type: "tick", now: START + 15 * 60_000 })
      ).toStrictEqual({ status: "idle" });
    });

    it("ignores ticks when the timer is off", () => {
      const state = begin("2:1", { kind: "quran" });
      expect(state).toMatchObject({ sleepAt: null });
      expect(
        recitationPlayback(state, { type: "tick", now: START + 10 ** 9 })
      ).toBe(state);
    });

    it("stops after the last ayah of the surah, however far the plan goes", () => {
      const { heard, last } = sequence(
        "112:3",
        { kind: "quran" },
        { sleep: { kind: "endOfSurah" } }
      );
      expect(heard).toStrictEqual(["112:3", "112:4"]);
      expect(last).toStrictEqual({ status: "idle" });
    });

    it("finishes the ayah repeats of the surah's last ayah first", () => {
      const { heard } = sequence(
        "1:6",
        { kind: "quran" },
        { sleep: { kind: "endOfSurah" }, ayahRepeat: 2 }
      );
      expect(heard).toStrictEqual(["1:6", "1:6", "1:7", "1:7"]);
    });
  });

  describe("continue to the next ayat?", () => {
    it("asks when a range ends, staying on its last ayah", () => {
      expect(atEnd({ kind: "page" })).toMatchObject({
        status: "awaiting-continue",
        ayah: "1:7",
      });
    });

    it("asks only after the last repeat of the range", () => {
      const { heard, last } = sequence(
        "1:6",
        { kind: "page" },
        { rangeRepeat: 2 }
      );
      expect(heard).toStrictEqual(["1:6", "1:7", "1:6", "1:7"]);
      expect(last.status).toBe("awaiting-continue");
    });

    it("continues the same kind of range from the next ayah", () => {
      const asking = atEnd({ kind: "page" });
      const next = recitationPlayback(asking, { type: "continue" });
      expect(next).toMatchObject({
        status: "loading",
        ayah: "2:1",
        plan: { from: "2:1", to: { kind: "page" } },
        ayahPass: 1,
        rangePass: 1,
      });
      // Page 2 starts at 2:1 and ends at 2:5: the whole next page plays.
      expect(sequence("2:1", { kind: "page" }, noPrompt).heard.at(-1)).toBe(
        "2:5"
      );
    });

    it("keeps a chosen-ayah range's length when continuing", () => {
      const asking = atEnd({ kind: "ayah", ayah: "1:7" }, "1:5");
      expect(recitationPlayback(asking, { type: "continue" })).toMatchObject({
        ayah: "2:1",
        plan: { to: { kind: "ayah", ayah: "2:3" } },
      });
    });

    it("keeps the repeats, pause, speed and sleep timer when continuing", () => {
      const plan = {
        ayahRepeat: 2,
        speed: 0.75,
        pause: { kind: "seconds", seconds: 1 },
      } as const;
      const asking = sequence("1:7", { kind: "page" }, plan).last;
      expect(asking.status).toBe("awaiting-continue");
      expect(recitationPlayback(asking, { type: "continue" })).toMatchObject({
        plan: { ...plan, from: "2:1" },
      });
    });

    it("stops when declined", () => {
      expect(
        recitationPlayback(atEnd({ kind: "page" }), { type: "stop" })
      ).toStrictEqual({ status: "idle" });
    });

    it("does not ask when the setting is off", () => {
      expect(sequence("1:5", { kind: "page" }, noPrompt).last).toStrictEqual({
        status: "idle",
      });
    });

    it("does not ask after 114:6: there is no next ayah", () => {
      expect(sequence("114:5", { kind: "juz" }, {}).last).toStrictEqual({
        status: "idle",
      });
    });

    it("does not ask for Home's Verse of the Day", () => {
      const state = recitationPlayback(
        recitationPlayback(
          {
            ...(begin("2:255", { kind: "ayah", ayah: "2:255" }) as object),
          } as RecitationPlayback,
          { type: "stop" }
        ),
        {
          type: "play",
          ayah: "2:255",
          reciter: "ar.alafasy",
          to: { kind: "ayah", ayah: "2:255" },
          origin: "verse-of-the-day",
        }
      );
      expect(state).toMatchObject({ plan: { askToContinueAtEnd: false } });
    });

    it("ignores continue when nothing was asked", () => {
      const state = begin("1:1", { kind: "page" });
      expect(recitationPlayback(state, { type: "continue" })).toBe(state);
    });

    it("lets the sleep timer end the question", () => {
      const asking = recitationPlayback(
        sequence(
          "1:5",
          { kind: "page" },
          { sleep: { kind: "minutes", minutes: 15 } }
        ).last,
        { type: "tick", now: START + 15 * 60_000 }
      );
      expect(asking).toStrictEqual({ status: "idle" });
    });
  });

  describe("speed", () => {
    it("holds the plan's speed between 0.75 and 1.5", () => {
      expect(playbackPlan("1:1", undefined, { speed: 3 }).speed).toBe(1.5);
      expect(playbackPlan("1:1", undefined, { speed: 0.1 }).speed).toBe(0.75);
      expect(playbackPlan("1:1", undefined, { speed: 1.25 }).speed).toBe(1.25);
    });
  });
});
