import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CHROME_IDLE_MS, chromeTransition, createReaderChrome } from ".";
import type { AyahKey, ChromeEvent, ChromeState, ReaderChrome } from ".";

const hidden: ChromeState = {
  visible: false,
  sheet: null,
  scrubbing: false,
  pressing: null,
};
const shown: ChromeState = { ...hidden, visible: true };

describe("reader chrome transitions", () => {
  it("toggles on a tap", () => {
    expect(chromeTransition(hidden, { type: "tap" })).toStrictEqual(shown);
    expect(chromeTransition(shown, { type: "tap" })).toStrictEqual(hidden);
  });

  it("hides on inactivity and on the start of a swipe or scroll", () => {
    expect(chromeTransition(shown, { type: "idle" })).toStrictEqual(hidden);
    expect(chromeTransition(shown, { type: "scroll-start" })).toStrictEqual(
      hidden
    );
    expect(chromeTransition(hidden, { type: "scroll-start" })).toBe(hidden);
  });

  it("opens an ayah's sheet on a long-press without toggling the chrome", () => {
    const sheet = { kind: "ayah", ayah: "2:255" } as const;
    expect(
      chromeTransition(hidden, { type: "long-press", ayah: "2:255" })
    ).toStrictEqual({ ...hidden, sheet });
    expect(
      chromeTransition(shown, { type: "long-press", ayah: "2:255" })
    ).toStrictEqual({ ...shown, sheet });
  });

  it("stays open while a sheet is open, and leaves taps to the sheet", () => {
    const withSheet = chromeTransition(shown, {
      type: "open-sheet",
      sheet: { kind: "settings" },
    });
    expect(chromeTransition(withSheet, { type: "idle" })).toBe(withSheet);
    expect(chromeTransition(withSheet, { type: "scroll-start" })).toBe(
      withSheet
    );
    expect(chromeTransition(withSheet, { type: "tap" })).toBe(withSheet);
    expect(chromeTransition(withSheet, { type: "close-sheet" })).toStrictEqual(
      shown
    );
  });

  it("stays open while the scrubber is held", () => {
    const holding = chromeTransition(shown, { type: "scrubber-hold" });
    expect(holding).toStrictEqual({ ...shown, scrubbing: true });
    expect(chromeTransition(holding, { type: "idle" })).toBe(holding);
    expect(chromeTransition(holding, { type: "scroll-start" })).toBe(holding);
    expect(
      chromeTransition(holding, { type: "scrubber-release" })
    ).toStrictEqual(shown);
  });
});

describe("pressing an ayah", () => {
  it("lights the ayah under the finger at once, leaving the chrome alone", () => {
    expect(
      chromeTransition(hidden, { type: "press-in", ayah: "2:255" })
    ).toStrictEqual({ ...hidden, pressing: "2:255" });
    expect(
      chromeTransition(shown, { type: "press-in", ayah: "2:255" })
    ).toStrictEqual({ ...shown, pressing: "2:255" });
  });

  it("opens the pressed ayah's sheet when the press is held", () => {
    const pressing = chromeTransition(hidden, {
      type: "press-in",
      ayah: "2:255",
    });
    const held = chromeTransition(pressing, {
      type: "long-press",
      ayah: "2:255",
    });
    expect(held).toStrictEqual({
      ...hidden,
      sheet: { kind: "ayah", ayah: "2:255" },
    });
    expect(chromeTransition(held, { type: "press-out" })).toBe(held);
  });

  it("still toggles the chrome on a plain tap, and the light goes out", () => {
    const pressing = chromeTransition(hidden, {
      type: "press-in",
      ayah: "2:255",
    });
    const released = chromeTransition(pressing, { type: "press-out" });
    expect(released).toStrictEqual(hidden);
    expect(chromeTransition(released, { type: "tap" })).toStrictEqual(shown);
    expect(chromeTransition(pressing, { type: "tap" })).toStrictEqual(shown);
  });

  it("puts the light out when the finger starts a swipe instead", () => {
    const pressing = chromeTransition(shown, {
      type: "press-in",
      ayah: "2:255",
    });
    expect(chromeTransition(pressing, { type: "scroll-start" })).toStrictEqual(
      hidden
    );
  });
});

const sheetOn = (ayah: AyahKey): ChromeState => ({
  ...hidden,
  sheet: { kind: "ayah", ayah },
});
const moved = (ayah: AyahKey, direction: "previous" | "next") =>
  chromeTransition(sheetOn(ayah), { type: "move-selection", direction });

describe("moving the ayah sheet", () => {
  it("moves the selection to the neighbouring ayah without closing", () => {
    expect(moved("2:255", "next")).toStrictEqual(sheetOn("2:256"));
    expect(moved("2:255", "previous")).toStrictEqual(sheetOn("2:254"));
  });

  it("crosses surah boundaries", () => {
    expect(moved("1:7", "next")).toStrictEqual(sheetOn("2:1"));
    expect(moved("2:1", "previous")).toStrictEqual(sheetOn("1:7"));
  });

  it("stops at the first and last ayah of the Quran", () => {
    const first = sheetOn("1:1");
    expect(
      chromeTransition(first, { type: "move-selection", direction: "previous" })
    ).toBe(first);
    const last = sheetOn("114:6");
    expect(
      chromeTransition(last, { type: "move-selection", direction: "next" })
    ).toBe(last);
  });

  it("does nothing without an ayah sheet open", () => {
    const settings: ChromeState = { ...shown, sheet: { kind: "settings" } };
    expect(
      chromeTransition(settings, { type: "move-selection", direction: "next" })
    ).toBe(settings);
    expect(
      chromeTransition(hidden, { type: "move-selection", direction: "next" })
    ).toBe(hidden);
  });
});

describe("reader chrome timer", () => {
  let chrome: ReaderChrome;
  let changes: ChromeState[];

  const start = (...events: ChromeEvent[]) => {
    changes = [];
    chrome = createReaderChrome({ onChange: (state) => changes.push(state) });
    for (const event of events) {
      chrome.send(event);
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    chrome.dispose();
    vi.useRealTimers();
  });

  it("starts hidden and hides 4 seconds after a tap shows it", () => {
    start();
    expect(chrome.getState()).toStrictEqual(hidden);
    chrome.send({ type: "tap" });
    vi.advanceTimersByTime(CHROME_IDLE_MS - 1);
    expect(chrome.getState().visible).toBeTruthy();
    vi.advanceTimersByTime(1);
    expect(chrome.getState().visible).toBeFalsy();
    expect(changes).toStrictEqual([shown, hidden]);
  });

  it("restarts the wait on any activity", () => {
    start({ type: "tap" });
    vi.advanceTimersByTime(3000);
    chrome.send({ type: "interact" });
    vi.advanceTimersByTime(3000);
    expect(chrome.getState().visible).toBeTruthy();
    vi.advanceTimersByTime(1000);
    expect(chrome.getState().visible).toBeFalsy();
  });

  it("never hides while pinned, and waits again once unpinned", () => {
    start({ type: "tap" }, { type: "open-sheet", sheet: { kind: "settings" } });
    vi.advanceTimersByTime(CHROME_IDLE_MS * 3);
    expect(chrome.getState().visible).toBeTruthy();
    chrome.send({ type: "close-sheet" });
    chrome.send({ type: "scrubber-hold" });
    vi.advanceTimersByTime(CHROME_IDLE_MS * 3);
    expect(chrome.getState().visible).toBeTruthy();
    chrome.send({ type: "scrubber-release" });
    vi.advanceTimersByTime(CHROME_IDLE_MS);
    expect(chrome.getState().visible).toBeFalsy();
  });

  it("keeps a long-press sheet over hidden chrome without showing it", () => {
    start({ type: "long-press", ayah: "1:1" });
    vi.advanceTimersByTime(CHROME_IDLE_MS);
    expect(chrome.getState()).toStrictEqual({
      ...hidden,
      sheet: { kind: "ayah", ayah: "1:1" },
    });
  });

  it("hides at once when a swipe starts", () => {
    start({ type: "tap" }, { type: "scroll-start" });
    expect(chrome.getState().visible).toBeFalsy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
