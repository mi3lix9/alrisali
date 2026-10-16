import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  mode: {
    label: "Recite method",
    hold: "Hold",
    auto: "Auto",
    voice: "Voice",
    hybrid: "Voice + hold",
  },
  pace: {
    label: "Speed",
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
  },
  hint: {
    hold: "Press and hold the text to write the words",
    auto: "Words flow on their own — hold the text or tap pause to stop",
    paused: "Paused — tap continue to carry on",
    voice: "Recite aloud and the words follow you",
    hybrid: "Recite aloud, or hold the text to move ahead",
    listeningPaused: "Listening paused — tap continue to carry on",
    preparing: "Getting ready to listen…",
  },
  voice: {
    unavailable: {
      "no-recognizer":
        "Arabic speech recognition isn't available on this device.",
      "service-off":
        "Speech recognition is turned off on this device. Turn on Dictation in Settings.",
      denied:
        "Microphone or speech recognition access isn't allowed. Allow both in Settings to recite by voice.",
      restricted: "Speech recognition is restricted on this device.",
      offline:
        "Arabic recognition on this device needs the internet, and the device is offline.",
      failing: "Listening kept stopping without hearing anything.",
    },
    fallback: "Follow by touch instead: hold the text, or choose Auto.",
    network:
      "Arabic isn't available offline on this device, so your voice is sent over the internet to be recognised.",
    retry: "Try again",
    openSettings: "Open Settings",
  },
  text: {
    label: "Text to recite",
    hint: "Press and hold to follow the words",
  },
  progress: "{{count}} / {{total}}",
  pause: "Pause",
  resume: "Continue",
  restart: "Start over",
  done: "Recitation complete, may it be accepted",
};
