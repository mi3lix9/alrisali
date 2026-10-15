import { recitationPlayback } from "@alrisali/domain/quran";
import type {
  AyahKey,
  RecitationEvent,
  RecitationPlayback,
} from "@alrisali/domain/quran";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { create } from "zustand";

import { recitationCache } from "./recitation-cache";

// One recitation plays at a time, in the reader or on Home. The domain's
// `recitationPlayback` decides what plays; this module makes the device's
// audio follow it: an ayah is played from its file on the device when one
// under 7 days old is there, otherwise streamed straight from the reciter's
// source and then kept.

const usePlaybackStore = create<{ playback: RecitationPlayback }>(() => ({
  playback: { status: "idle" },
}));

/** What recitation is doing now. */
export const useRecitationPlayback = (): RecitationPlayback =>
  usePlaybackStore((state) => state.playback);

let player: AudioPlayer | null = null;
/** Bumped on every load and stop, so a slow load never plays over a newer one. */
let loadId = 0;

type Send = (event: RecitationEvent) => void;

const devicePlayer = (send: Send): AudioPlayer => {
  if (player) {
    return player;
  }
  player = createAudioPlayer(null);
  // Recitation is the point of the screen: play with the ringer off too.
  void setAudioModeAsync({ playsInSilentMode: true });
  player.addListener("playbackStatusUpdate", (status) => {
    const { playback } = usePlaybackStore.getState();
    if (status.didJustFinish) {
      send({ type: "finished" });
    } else if (status.error) {
      send({ type: "failed" });
    } else if (status.playing && playback.status === "loading") {
      send({ type: "ready" });
    }
  });
  // Once a session, delete files older than 7 days.
  void recitationCache.prune();
  return player;
};

const load = async (reciter: string, ayah: AyahKey, send: Send) => {
  loadId += 1;
  const id = loadId;
  const recited = { reciter, ayah };
  try {
    const uri = await recitationCache.source(recited);
    if (id !== loadId) {
      return;
    }
    const audio = devicePlayer(send);
    audio.replace({ uri });
    if (usePlaybackStore.getState().playback.status !== "paused") {
      audio.play();
    }
  } catch {
    if (id === loadId) {
      send({ type: "failed" });
    }
    return;
  }
  try {
    // A no-op while the file on the device is under 7 days old.
    await recitationCache.keep(recited);
  } catch {
    // Keeping the file is best effort: the ayah already plays from the stream.
  }
};

const follow = (
  previous: RecitationPlayback,
  next: RecitationPlayback,
  event: RecitationEvent,
  send: Send
) => {
  if (next.status === "idle") {
    loadId += 1;
    player?.pause();
    return;
  }
  const moved = previous.status !== "idle" && previous.ayah !== next.ayah;
  if (
    next.status === "loading" &&
    (event.type === "play" || moved || previous.status === "error")
  ) {
    void load(next.reciter, next.ayah, send);
  } else if (next.status === "paused") {
    player?.pause();
  } else if (next.status === "playing" && previous.status === "paused") {
    player?.play();
  }
};

/** Tells recitation what the Believer (or the audio) did. */
export const sendRecitation = (event: RecitationEvent) => {
  const previous = usePlaybackStore.getState().playback;
  const next = recitationPlayback(previous, event);
  if (next === previous) {
    return;
  }
  usePlaybackStore.setState({ playback: next });
  follow(previous, next, event, sendRecitation);
};

/** Ends the reader's recitation (not Home's Verse of the Day) as the reader closes. */
export const stopReaderRecitation = () => {
  const { playback } = usePlaybackStore.getState();
  if (playback.status !== "idle" && playback.until === null) {
    sendRecitation({ type: "stop" });
  }
};
