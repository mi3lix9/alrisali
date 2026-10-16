import { describe, expect, it } from "vitest";

import {
  AUTO_SCROLL_SPEEDS,
  DEFAULT_AUTO_SCROLL_SPEED,
  advanceAutoScroll,
  stepAutoScrollSpeed,
} from "./auto-scroll";

const at = (speed: number) =>
  advanceAutoScroll({
    offset: 0,
    speed,
    elapsedMs: 1000,
    maxOffset: 10_000,
  }).offset;

describe(advanceAutoScroll, () => {
  it("moves down by the speed's pixels per second over the elapsed time", () => {
    const next = advanceAutoScroll({
      offset: 100,
      speed: 3,
      elapsedMs: 500,
      maxOffset: 10_000,
    });
    expect(next.offset).toBeCloseTo(100 + (AUTO_SCROLL_SPEEDS[2] ?? 0) / 2);
    expect(next.finished).toBeFalsy();
  });

  it("is faster at a higher speed", () => {
    expect(at(5)).toBeGreaterThan(at(1));
  });

  it("stops at the end of the text and reports it finished", () => {
    expect(
      advanceAutoScroll({
        offset: 990,
        speed: 5,
        elapsedMs: 1000,
        maxOffset: 1000,
      })
    ).toStrictEqual({ offset: 1000, finished: true });
  });

  it("never moves backwards for a stalled or negative frame", () => {
    expect(
      advanceAutoScroll({
        offset: 50,
        speed: 3,
        elapsedMs: -16,
        maxOffset: 1000,
      }).offset
    ).toBe(50);
  });

  it("treats a text shorter than the screen as finished", () => {
    expect(
      advanceAutoScroll({ offset: 0, speed: 3, elapsedMs: 16, maxOffset: 0 })
    ).toStrictEqual({ offset: 0, finished: true });
  });
});

describe(stepAutoScrollSpeed, () => {
  it("steps up and down", () => {
    expect(stepAutoScrollSpeed(3, 1)).toBe(4);
    expect(stepAutoScrollSpeed(3, -1)).toBe(2);
  });

  it("stays within the offered speeds", () => {
    expect(stepAutoScrollSpeed(1, -1)).toBe(1);
    expect(stepAutoScrollSpeed(AUTO_SCROLL_SPEEDS.length, 1)).toBe(
      AUTO_SCROLL_SPEEDS.length
    );
  });

  it("starts at a speed that is offered", () => {
    expect(DEFAULT_AUTO_SCROLL_SPEED).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_AUTO_SCROLL_SPEED).toBeLessThanOrEqual(
      AUTO_SCROLL_SPEEDS.length
    );
  });
});
