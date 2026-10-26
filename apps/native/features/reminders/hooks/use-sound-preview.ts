import { useCallback, useEffect, useState } from "react";

import { stopAdhan } from "../utils/adhan-player";

export interface SoundPreview {
  /** The sound playing, or null. */
  playingId: string | null;
  stop: () => void;
  /**
   * Starts `id`'s sound with `start` (given what to do when it ends), or stops
   * it when it is the one playing. `start` returns false when it cannot play.
   */
  toggle: (id: string, start: (onEnd: () => void) => boolean) => void;
  /** Records that `id` is playing, for a sound started elsewhere. */
  mark: (id: string | null) => void;
}

/**
 * Plays one sound at a time for the Believer to hear before choosing it; it
 * stops when the component unmounts.
 */
export const useSoundPreview = (): SoundPreview => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    stopAdhan();
    setPlayingId(null);
  }, []);

  const toggle = useCallback(
    (id: string, start: (onEnd: () => void) => boolean) => {
      if (playingId === id) {
        stop();
        return;
      }
      setPlayingId(start(() => setPlayingId(null)) ? id : null);
    },
    [playingId, stop]
  );

  useEffect(() => stopAdhan, []);

  return { playingId, stop, toggle, mark: setPlayingId };
};
