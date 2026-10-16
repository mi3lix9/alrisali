import type { AyahKey } from "./mushaf";
import { nextAyah, previousAyah } from "./recitation";

// The reading screen's chrome (top bar, recitation pill, bottom bar) is hidden
// by default. A tap shows it; a tap, 4 s of inactivity, or the start of a swipe
// or scroll hides it. An open sheet or a held scrubber pins it open. Pressing
// an ayah lights it at once; holding it opens that ayah's sheet and never
// toggles the chrome. The ayah sheet's arrows move its selection in place.

export const CHROME_IDLE_MS = 4000;

export type ReaderSheet =
  | { kind: "ayah"; ayah: AyahKey }
  | { kind: "settings" }
  /** The Surah and Juz index. */
  | { kind: "index" }
  | { kind: "page-jump" }
  | { kind: "search" };

export interface ChromeState {
  visible: boolean;
  sheet: ReaderSheet | null;
  scrubbing: boolean;
  /** The ayah under the finger before a long-press fires, drawn lit. */
  pressing: AyahKey | null;
}

export type ChromeEvent =
  | { type: "tap" }
  /** CHROME_IDLE_MS passed without activity. */
  | { type: "idle" }
  | { type: "scroll-start" }
  | { type: "long-press"; ayah: AyahKey }
  | { type: "open-sheet"; sheet: ReaderSheet }
  | { type: "close-sheet" }
  | { type: "scrubber-hold" }
  | { type: "scrubber-release" }
  /** Any use of the chrome's own controls; it restarts the idle wait. */
  | { type: "interact" }
  /** A finger came down on an ayah. */
  | { type: "press-in"; ayah: AyahKey }
  /** The finger lifted or left, whether or not it tapped or held. */
  | { type: "press-out" }
  /** The ayah sheet's arrows: its neighbour in Quran order, across surahs. */
  | { type: "move-selection"; direction: "previous" | "next" };

export const INITIAL_CHROME: ChromeState = {
  visible: false,
  sheet: null,
  scrubbing: false,
  pressing: null,
};

/** Whether something holds the chrome open whatever the idle time. */
export const isChromePinned = (state: ChromeState): boolean =>
  state.sheet !== null || state.scrubbing;

/** The ayah sheet moved to its ayah's neighbour; unchanged at 1:1 and 114:6. */
const moveSelection = (
  state: ChromeState,
  direction: "previous" | "next"
): ChromeState => {
  if (state.sheet?.kind !== "ayah") {
    return state;
  }
  const ayah =
    direction === "next"
      ? nextAyah(state.sheet.ayah)
      : previousAyah(state.sheet.ayah);
  return ayah ? { ...state, sheet: { kind: "ayah", ayah } } : state;
};

export const chromeTransition = (
  state: ChromeState,
  event: ChromeEvent
): ChromeState => {
  switch (event.type) {
    case "tap": {
      // A tap with a sheet open lands on the sheet, which closes itself.
      return state.sheet
        ? state
        : { ...state, visible: !state.visible, pressing: null };
    }
    case "idle": {
      return state.visible && !isChromePinned(state)
        ? { ...state, visible: false }
        : state;
    }
    case "scroll-start": {
      // A swipe also puts out the light of the ayah it started on.
      const released = state.pressing ? { ...state, pressing: null } : state;
      return chromeTransition(released, { type: "idle" });
    }
    case "long-press": {
      return {
        ...state,
        sheet: { kind: "ayah", ayah: event.ayah },
        pressing: null,
      };
    }
    case "open-sheet": {
      return { ...state, sheet: event.sheet };
    }
    case "close-sheet": {
      return state.sheet ? { ...state, sheet: null } : state;
    }
    case "scrubber-hold": {
      return { ...state, visible: true, scrubbing: true };
    }
    case "scrubber-release": {
      return state.scrubbing ? { ...state, scrubbing: false } : state;
    }
    case "press-in": {
      return { ...state, pressing: event.ayah };
    }
    case "press-out": {
      return state.pressing ? { ...state, pressing: null } : state;
    }
    case "move-selection": {
      return moveSelection(state, event.direction);
    }
    default: {
      return state;
    }
  }
};

export interface ReaderChrome {
  getState: () => ChromeState;
  send: (event: ChromeEvent) => void;
  /** Stops the idle timer; call when the reader closes. */
  dispose: () => void;
}

export interface ReaderChromeOptions {
  initial?: ChromeState;
  idleMs?: number;
  onChange?: (state: ChromeState) => void;
}

/**
 * Runs the chrome state machine with its inactivity timer: every event is
 * activity, and the chrome hides CHROME_IDLE_MS after the last one unless it
 * is pinned.
 */
export const createReaderChrome = ({
  initial = INITIAL_CHROME,
  idleMs = CHROME_IDLE_MS,
  onChange,
}: ReaderChromeOptions = {}): ReaderChrome => {
  let state = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const send = (event: ChromeEvent) => {
    const next = chromeTransition(state, event);
    clearTimeout(timer);
    timer = undefined;
    if (next.visible && !isChromePinned(next)) {
      timer = setTimeout(() => send({ type: "idle" }), idleMs);
    }
    if (next !== state) {
      state = next;
      onChange?.(state);
    }
  };

  if (state.visible && !isChromePinned(state)) {
    timer = setTimeout(() => send({ type: "idle" }), idleMs);
  }

  return {
    getState: () => state,
    send,
    dispose: () => clearTimeout(timer),
  };
};
