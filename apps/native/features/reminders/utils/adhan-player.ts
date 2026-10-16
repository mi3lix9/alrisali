import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

import { adhanAsset } from "../data/adhan-catalogue";

let player: AudioPlayer | null = null;

/** Stops whatever adhan or takbir the app is playing. */
export const stopAdhan = (): void => {
  player?.remove();
  player = null;
};

/**
 * Plays an installed adhan recording in the app (the editor's Test, or the
 * full adhan when an At-Time Alert is opened on iOS), replacing any other.
 * False when the file is not installed.
 */
export const playAdhan = (file: string, onEnd?: () => void): boolean => {
  const asset = adhanAsset(file);
  if (asset === undefined) {
    return false;
  }
  stopAdhan();
  // The Believer asked for it: play with the ringer off too.
  void setAudioModeAsync({ playsInSilentMode: true });
  const audio = createAudioPlayer(asset);
  player = audio;
  audio.addListener("playbackStatusUpdate", (status) => {
    if (status.didJustFinish && player === audio) {
      stopAdhan();
      onEnd?.();
    }
  });
  audio.play();
  return true;
};
