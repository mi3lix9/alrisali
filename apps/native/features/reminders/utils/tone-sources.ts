import adhanVoice from "@/assets/sounds/adhan.wav";
import bell from "@/assets/sounds/bell.wav";
import chime from "@/assets/sounds/chime.wav";

/** The bundled recording of each Reminder tone with a file, for previews. */
export const TONE_SOURCES = {
  chime,
  bell,
  voice: adhanVoice,
} as const;
