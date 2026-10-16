import type { AyahKey } from "@alrisali/domain/quran";
import { useEffect, useEffectEvent } from "react";

import { useRecitationPlayback } from "../data/recitation-player";

/**
 * The ayah the reader's recitation is on, or null when it is not reciting (or
 * Home's Verse of the Day is). Calls `onMove` each time recitation moves to
 * another ayah, so the page can follow the audio.
 */
export const useRecitingAyah = (
  onMove: (ayah: AyahKey) => void
): AyahKey | null => {
  const playback = useRecitationPlayback();
  const ayah =
    playback.status !== "idle" && playback.origin === "reader"
      ? playback.ayah
      : null;
  const move = useEffectEvent(onMove);
  useEffect(() => {
    if (ayah) {
      move(ayah);
    }
  }, [ayah]);
  return ayah;
};
