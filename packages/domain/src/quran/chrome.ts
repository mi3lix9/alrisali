import type { AyahKey } from "./mushaf";

// The reading screen's chrome (top bar, recitation pill, bottom bar) is hidden
// by default. A tap shows it; a tap, 4 s of inactivity, or the start of a swipe
// or scroll hides it. An open sheet or a held scrubber pins it open. A
// long-press on an ayah opens that ayah's sheet and never toggles the chrome.

export const CHROME_IDLE_MS = 4000;

export type ReaderSheet =
  | { kind: "ayah"; ayah: AyahKey }
  | { kind: "settings" };

export interface ChromeState {
  visible: boolean;
  sheet: ReaderSheet | null;
  scrubbing: boolean;
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
  | { type: "interact" };

export const INITIAL_CHROME: ChromeState = {
  visible: false,
  sheet: null,
  scrubbing: false,
};

/** Whether something holds the chrome open whatever the idle time. */
export const isChromePinned = (state: ChromeState): boolean =>
  state.sheet !== null || state.scrubbing;

export const chromeTransition = (
  state: ChromeState,
  event: ChromeEvent
): ChromeState => {
  switch (event.type) {
    case "tap": {
      // A tap with a sheet open lands on the sheet, which closes itself.
      return state.sheet ? state : { ...state, visible: !state.visible };
    }
    case "idle":
    case "scroll-start": {
      return state.visible && !isChromePinned(state)
        ? { ...state, visible: false }
        : state;
    }
    case "long-press": {
      return { ...state, sheet: { kind: "ayah", ayah: event.ayah } };
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
