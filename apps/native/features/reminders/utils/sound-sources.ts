import adhanHatamzadehTakbeer from "@/assets/sounds/adhan.wav";
import adhanHatamzadehFull from "@/assets/sounds/adhan_hatamzadeh_full.ogg";
import adhanSobhdelFull from "@/assets/sounds/adhan_sobhdel_full.ogg";
import adhanSobhdelTakbeer from "@/assets/sounds/adhan_sobhdel_takbeer.wav";
import bell from "@/assets/sounds/bell.wav";
import chime from "@/assets/sounds/chime.wav";

import { ADHAN_FILES, SOUND_FILES } from "./sound-files";
import type { PreviewSoundId, SoundFile } from "./sound-files";

// Metro bundles these as assets (it knows .wav and .ogg), so a preview needs
// no download. Kept apart from sound-files.ts, which holds no asset import so
// tests can load it without a bundler.
const SOURCE_OF_FILE = {
  "chime.wav": chime,
  "bell.wav": bell,
  "adhan.wav": adhanHatamzadehTakbeer,
  "adhan_hatamzadeh_full.ogg": adhanHatamzadehFull,
  "adhan_sobhdel_takbeer.wav": adhanSobhdelTakbeer,
  "adhan_sobhdel_full.ogg": adhanSobhdelFull,
} as const satisfies Record<SoundFile, number>;

const FILE_OF_SOUND: Record<PreviewSoundId, SoundFile> = {
  ...SOUND_FILES,
  ...ADHAN_FILES,
};

/** The bundled asset a sound previews from. */
export const previewSource = (id: PreviewSoundId): number =>
  SOURCE_OF_FILE[FILE_OF_SOUND[id]];
