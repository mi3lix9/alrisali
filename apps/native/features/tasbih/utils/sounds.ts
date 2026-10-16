import { createAudioPlayer } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

import doneSound from "@/assets/sounds/tasbih-done.wav";
import stepSound from "@/assets/sounds/tasbih-step.wav";
import tapSound from "@/assets/sounds/tasbih-tap.wav";

import type { TasbihHaptic } from "./haptics";

const SOURCES: Record<TasbihHaptic, number> = {
  tap: tapSound,
  step: stepSound,
  done: doneSound,
};

let players: Record<TasbihHaptic, AudioPlayer> | null = null;

/**
 * Loads the three counter sounds once, so the first tap in sound mode plays
 * at once. They mix with other audio (expo-audio's default session).
 */
export const preloadTasbihSounds = (): Record<TasbihHaptic, AudioPlayer> => {
  players ??= {
    tap: createAudioPlayer(SOURCES.tap),
    step: createAudioPlayer(SOURCES.step),
    done: createAudioPlayer(SOURCES.done),
  };
  return players;
};

/** Plays a counter sound from its start; callers never wait on it. */
export const playTasbihSound = async (sound: TasbihHaptic): Promise<void> => {
  try {
    const player = preloadTasbihSounds()[sound];
    // A fast tap restarts the sound instead of waiting for it to end.
    await player.seekTo(0);
    player.play();
  } catch {
    // A device that cannot play the sound still counts.
  }
};
