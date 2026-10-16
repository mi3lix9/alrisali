import { recitationPlayback } from "@alrisali/domain/quran";
import type {
  RecitationEvent,
  RecitationPlayback,
} from "@alrisali/domain/quran";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRecitationTimers } from "./recitation-timers";
import type { RecitationTimers } from "./recitation-timers";

const START = 5_000_000;

let current: RecitationPlayback = { status: "idle" };
let timers: RecitationTimers = { follow: () => {} };

/** Recitation driven by the timers, the way the player drives it. */
const send = (event: RecitationEvent) => {
  current = recitationPlayback(current, event);
  timers.follow(current);
};

const harness = () => {
  current = { status: "idle" };
  timers = createRecitationTimers(send, Date.now);
  return { send, state: () => current };
};

describe(createRecitationTimers, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits the chosen seconds of silence, then loads the next ayah", () => {
    const player = harness();
    player.send({
      type: "play",
      ayah: "1:1",
      reciter: "ar.alafasy",
      settings: { pause: { kind: "seconds", seconds: 3 } },
    });
    player.send({ type: "ready" });
    player.send({ type: "finished", durationSeconds: 5 });
    expect(player.state()).toMatchObject({ status: "pausing", ayah: "1:2" });
    vi.advanceTimersByTime(2999);
    expect(player.state()).toMatchObject({ status: "pausing" });
    vi.advanceTimersByTime(1);
    expect(player.state()).toMatchObject({ status: "loading", ayah: "1:2" });
  });

  it("waits a multiple of the ayah's length", () => {
    const player = harness();
    player.send({
      type: "play",
      ayah: "1:1",
      reciter: "ar.alafasy",
      settings: { pause: { kind: "ayahLength", factor: 1.5 } },
    });
    player.send({ type: "ready" });
    player.send({ type: "finished", durationSeconds: 4 });
    vi.advanceTimersByTime(5999);
    expect(player.state()).toMatchObject({ status: "pausing" });
    vi.advanceTimersByTime(1);
    expect(player.state()).toMatchObject({ status: "loading" });
  });

  it("stops waiting when the silence is paused", () => {
    const player = harness();
    player.send({
      type: "play",
      ayah: "1:1",
      reciter: "ar.alafasy",
      settings: { pause: { kind: "seconds", seconds: 3 } },
    });
    player.send({ type: "ready" });
    player.send({ type: "finished" });
    player.send({ type: "pause" });
    vi.advanceTimersByTime(10_000);
    expect(player.state()).toMatchObject({ status: "paused" });
  });

  it("stops recitation when the sleep timer is up", () => {
    const player = harness();
    player.send({
      type: "play",
      ayah: "2:1",
      reciter: "ar.alafasy",
      settings: { sleep: { kind: "minutes", minutes: 15 } },
      now: Date.now(),
    });
    player.send({ type: "ready" });
    vi.advanceTimersByTime(15 * 60_000 - 1);
    expect(player.state()).toMatchObject({ status: "playing" });
    vi.advanceTimersByTime(1);
    expect(player.state()).toStrictEqual({ status: "idle" });
  });

  it("cancels the sleep timer when recitation is stopped", () => {
    const player = harness();
    player.send({
      type: "play",
      ayah: "2:1",
      reciter: "ar.alafasy",
      settings: { sleep: { kind: "minutes", minutes: 30 } },
      now: Date.now(),
    });
    player.send({ type: "stop" });
    expect(vi.getTimerCount()).toBe(0);
  });
});
