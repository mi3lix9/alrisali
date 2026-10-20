import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

import { adhanFileUri } from "../data/adhan-catalogue";

let player: AudioPlayer | null = null;

/** Stops whatever adhan or takbir the app is playing. */
export const stopAdhan = (): void => {
  player?.remove();
  player = null;
};

/**
 * Plays a downloaded adhan recording in the app (the editor's Test, or the
 * full adhan when an At-Time Alert is opened on iOS), replacing any other.
 * False when the file is not on the device.
 */
export const playAdhan = (file: string, onEnd?: () => void): boolean => {
  const uri = adhanFileUri(file);
  if (uri === null) {
    return false;
  }
  stopAdhan();
  // The Believer asked for it: play with the ringer off too.
  void setAudioModeAsync({ playsInSilentMode: true });
  const audio = createAudioPlayer(uri);
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
