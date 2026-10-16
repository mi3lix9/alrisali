import { SURAHS } from "@alrisali/content/quran";
import {
  findAyah,
  findReciter,
  recitationPlayback,
} from "@alrisali/domain/quran";
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
// source and then kept. Audio goes on in the background and the lock screen
// shows what is reciting; pausing or resuming there is followed back into
// `recitationPlayback`.

const usePlaybackStore = create<{ playback: RecitationPlayback }>(() => ({
  playback: { status: "idle" },
}));

/** What recitation is doing now. */
export const useRecitationPlayback = (): RecitationPlayback =>
  usePlaybackStore((state) => state.playback);

let player: AudioPlayer | null = null;
/** When this module last paused or resumed the player itself. */
let commandedAt = 0;
/** How long after its own command a status update is not taken for the lock screen's. */
const REMOTE_SETTLE_MS = 800;
/** Within this many seconds of the end, a silent player has finished, not been paused. */
const END_MARGIN_SECONDS = 0.5;
/** Bumped on every load and stop, so a slow load never plays over a newer one. */
let loadId = 0;

type Send = (event: RecitationEvent) => void;

const devicePlayer = (send: Send): AudioPlayer => {
  if (player) {
    return player;
  }
  player = createAudioPlayer(null);
  // Recitation is the point of the screen: play with the ringer off too, and
  // on with the screen locked or another app in front. The lock screen's
  // controls need the session to be exclusive.
  void setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
  });
  player.addListener("playbackStatusUpdate", (status) => {
    const { playback } = usePlaybackStore.getState();
    if (status.didJustFinish) {
      send({ type: "finished" });
    } else if (status.error) {
      send({ type: "failed" });
    } else if (status.playing && playback.status === "loading") {
      send({ type: "ready" });
    } else if (Date.now() - commandedAt > REMOTE_SETTLE_MS) {
      // The lock screen, headphones or a call paused or resumed the player.
      const finishing =
        status.duration > 0 &&
        status.currentTime >= status.duration - END_MARGIN_SECONDS;
      if (
        playback.status === "playing" &&
        status.isLoaded &&
        !(status.playing || status.isBuffering || finishing)
      ) {
        send({ type: "pause" });
      } else if (playback.status === "paused" && status.playing) {
        send({ type: "resume" });
      }
    }
  });
  // Once a session, delete files older than 7 days.
  void recitationCache.prune();
  return player;
};

/** Shows the reciting ayah and its reciter on the lock screen. */
const showOnLockScreen = (
  audio: AudioPlayer,
  reciter: string,
  ayah: AyahKey
) => {
  const found = findAyah(ayah);
  const surah = found ? SURAHS[found.surah - 1] : undefined;
  audio.setActiveForLockScreen(
    true,
    {
      title: found && surah ? `${surah.nameAr} · ${found.ayah}` : ayah,
      artist: findReciter(reciter)?.name.ar ?? reciter,
    },
    { showSeekBackward: false, showSeekForward: false }
  );
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
    showOnLockScreen(audio, reciter, ayah);
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
    commandedAt = Date.now();
    player?.pause();
    player?.clearLockScreenControls();
    return;
  }
  const moved = previous.status !== "idle" && previous.ayah !== next.ayah;
  if (
    next.status === "loading" &&
    (event.type === "play" ||
      event.type === "reciter" ||
      moved ||
      previous.status === "error")
  ) {
    void load(next.reciter, next.ayah, send);
  } else if (next.status === "paused") {
    commandedAt = Date.now();
    player?.pause();
  } else if (next.status === "playing" && previous.status === "paused") {
    commandedAt = Date.now();
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
