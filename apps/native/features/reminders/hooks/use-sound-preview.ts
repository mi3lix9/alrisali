import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PreviewSoundId } from "../utils/sound-files";
import { previewSource } from "../utils/sound-sources";

const STATUS_INTERVAL_MS = 250;

interface Preview {
  /** The sound playing, or null. */
  id: PreviewSoundId | null;
  /** How far into it, from 0 to 1. */
  progress: number;
}

const IDLE: Preview = { id: null, progress: 0 };

/**
 * Plays one sound at a time for the Believer to hear before choosing it.
 * `toggle` starts a sound (stopping any other) or stops it when it is the one
 * playing; it also stops when the component unmounts.
 */
export const useSoundPreview = () => {
  const [preview, setPreview] = useState<Preview>(IDLE);
  const playerRef = useRef<AudioPlayer | null>(null);
  const playingRef = useRef<PreviewSoundId | null>(null);

  const stop = useCallback(() => {
    playingRef.current = null;
    playerRef.current?.pause();
    setPreview((current) => (current.id === null ? current : IDLE));
  }, []);

  const toggle = useCallback(
    (id: PreviewSoundId) => {
      if (playingRef.current === id) {
        stop();
        return;
      }
      let player = playerRef.current;
      if (!player) {
        player = createAudioPlayer(null, {
          updateInterval: STATUS_INTERVAL_MS,
        });
        // Hearing the sound is the point: play with the ringer off too.
        void setAudioModeAsync({ playsInSilentMode: true });
        player.addListener("playbackStatusUpdate", (status) => {
          if (playingRef.current === null) {
            return;
          }
          if (status.didJustFinish) {
            playingRef.current = null;
            setPreview(IDLE);
          } else if (status.duration > 0) {
            const { currentTime, duration } = status;
            setPreview({
              id: playingRef.current,
              progress: Math.min(currentTime / duration, 1),
            });
          }
        });
        playerRef.current = player;
      }
      playingRef.current = id;
      setPreview({ id, progress: 0 });
      player.replace(previewSource(id));
      player.play();
    },
    [stop]
  );

  useEffect(
    () => () => {
      playingRef.current = null;
      playerRef.current?.remove();
      playerRef.current = null;
    },
    []
  );

  return { playingId: preview.id, progress: preview.progress, toggle, stop };
};
