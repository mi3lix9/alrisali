import { createReaderChrome, INITIAL_CHROME } from "@alrisali/domain/quran";
import type { ChromeState, ReaderChrome } from "@alrisali/domain/quran";
import { useEffect, useMemo, useState } from "react";

/**
 * The reader's chrome state machine (`@alrisali/domain/quran`), with its 4 s
 * inactivity timer, as React state. Forward every gesture with `send`.
 */
export const useReaderChrome = (): [ChromeState, ReaderChrome["send"]] => {
  const [state, setState] = useState<ChromeState>(INITIAL_CHROME);
  // One machine per mount; `setState` never changes.
  const chrome = useMemo(() => createReaderChrome({ onChange: setState }), []);
  useEffect(() => () => chrome.dispose(), [chrome]);
  return [state, chrome.send];
};
