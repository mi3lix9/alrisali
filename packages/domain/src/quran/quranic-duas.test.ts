import { describe, expect, it } from "vitest";

import { findAyah } from "./mushaf";
import {
  filterQuranicDuas,
  playDuaEvent,
  QURANIC_DUAS,
  quranicDuaFacets,
  RECITATION_DUA_MOMENTS,
  RECITATION_DUAS,
  startDuaQueue,
  stepDuaQueue,
} from "./quranic-duas";
import type { QuranicDua } from "./quranic-duas";
import { recitationPlayback } from "./recitation";
import type { RecitationPlayback } from "./recitation";

const IDLE: RecitationPlayback = { status: "idle" };

const dua = (id: string): QuranicDua => {
  const found = QURANIC_DUAS.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`No dua ${id}`);
  }
  return found;
};

const playing = (id: string, ayah: string): RecitationPlayback => {
  const started = recitationPlayback(IDLE, playDuaEvent(dua(id), "ar.alafasy"));
  if (started.status === "idle") {
    throw new Error("not started");
  }
  return { ...started, status: "playing", ayah: ayah as never };
};

describe("the Quranic duas list", () => {
  it("lists duas of the Quran with unique ids, in mushaf order", () => {
    expect(QURANIC_DUAS.length).toBeGreaterThan(50);
    expect(new Set(QURANIC_DUAS.map((entry) => entry.id)).size).toBe(
      QURANIC_DUAS.length
    );
    expect(dua("7:23")).toMatchObject({ speaker: "adam" });
    expect(dua("2:127-128")).toMatchObject({ to: "2:128" });
  });
});

describe(filterQuranicDuas, () => {
  it("lists every dua without a filter", () => {
    expect(filterQuranicDuas()).toHaveLength(QURANIC_DUAS.length);
  });

  it("narrows to a speaker, a subject, or both", () => {
    const ayyub = filterQuranicDuas({ speaker: "ayyub" });
    expect(ayyub.map((entry) => entry.id)).toStrictEqual(["21:83", "38:41"]);
    const affliction = filterQuranicDuas({ subject: "affliction" });
    expect(affliction.map((entry) => entry.id)).toContain("21:87");
    expect(
      filterQuranicDuas({ speaker: "ayyub", subject: "affliction" })
    ).toHaveLength(2);
    expect(
      filterQuranicDuas({ speaker: "adam", subject: "family" })
    ).toStrictEqual([]);
  });

  it("offers only the speakers and subjects a filtered list still has", () => {
    const facets = quranicDuaFacets(filterQuranicDuas({ speaker: "adam" }));
    expect(facets).toStrictEqual({
      speakers: ["adam"],
      subjects: ["forgiveness"],
    });
  });
});

describe(playDuaEvent, () => {
  it("recites a dua from its first ayah to its last, then stops", () => {
    let state = recitationPlayback(IDLE, playDuaEvent(dua("3:191-194"), "r"));
    expect(state).toMatchObject({ status: "loading", ayah: "3:191" });
    state = recitationPlayback(state, { type: "ready" });
    for (const _ of ["3:192", "3:193", "3:194"]) {
      state = recitationPlayback(state, { type: "finished" });
      state = recitationPlayback(state, { type: "ready" });
    }
    expect(state).toMatchObject({ status: "playing", ayah: "3:194" });
    expect(recitationPlayback(state, { type: "finished" }).status).toBe("idle");
  });
});

describe(stepDuaQueue, () => {
  const queue = startDuaQueue([dua("7:23"), dua("2:127-128"), dua("11:47")]);

  it("starts the next dua when the current one's last ayah is recited", () => {
    const step = stepDuaQueue(queue, playing("7:23", "7:23"), IDLE);
    expect(step.play?.id).toBe("2:127-128");
    expect(step.queue?.index).toBe(1);
  });

  it("goes on through every dua in order and ends after the last", () => {
    let current = queue;
    const order: string[] = [];
    for (const last of ["7:23", "2:128", "11:47"]) {
      const step = stepDuaQueue(current, playing("7:23", last), IDLE);
      if (step.play) {
        order.push(step.play.id);
      }
      current = step.queue;
    }
    expect(order).toStrictEqual(["2:127-128", "11:47"]);
    expect(current).toBeNull();
  });

  it("keeps the queue while ayat inside the dua recite", () => {
    const step = stepDuaQueue(
      stepDuaQueue(queue, playing("7:23", "7:23"), IDLE).queue,
      IDLE,
      playing("2:127-128", "2:128")
    );
    expect(step.queue?.index).toBe(1);
    expect(step.play).toBeNull();
  });

  it("ends the queue when recitation stops before the dua's last ayah", () => {
    const mid = stepDuaQueue(
      startDuaQueue([dua("2:127-128"), dua("11:47")]),
      playing("2:127-128", "2:127"),
      IDLE
    );
    expect(mid).toStrictEqual({ queue: null, play: null });
  });

  it("ends the queue when something else starts reciting", () => {
    const elsewhere = recitationPlayback(IDLE, {
      type: "play",
      ayah: "36:1",
      reciter: "r",
    });
    expect(stepDuaQueue(queue, IDLE, elsewhere)).toStrictEqual({
      queue: null,
      play: null,
    });
  });

  it("has no queue for an empty list", () => {
    expect(startDuaQueue([])).toBeNull();
  });
});

describe("the recitation duas", () => {
  it("gives every moment real ayat", () => {
    for (const moment of RECITATION_DUA_MOMENTS) {
      expect(RECITATION_DUAS[moment].length).toBeGreaterThan(0);
      for (const { from, to } of RECITATION_DUAS[moment]) {
        expect(findAyah(from)).toBeDefined();
        expect(findAyah(to)).toBeDefined();
      }
    }
  });
});
