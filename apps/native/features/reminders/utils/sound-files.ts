import type { AdhanId } from "@alrisali/domain/reminders";

// Where each tone's and Adhan's sound comes from: the files in assets/sounds,
// which app.config.ts bundles as notification sounds and sound-sources.ts
// bundles for the in-app preview.

export const SOUND_FILES = {
  chime: "chime.wav",
  bell: "bell.wav",
} as const;

export const ADHAN_FILES = {
  "hatamzadeh-takbeer": "adhan.wav",
  "hatamzadeh-full": "adhan_hatamzadeh_full.ogg",
  "sobhdel-takbeer": "adhan_sobhdel_takbeer.wav",
  "sobhdel-full": "adhan_sobhdel_full.ogg",
} as const satisfies Record<AdhanId, string>;

export type SoundFile =
  | (typeof SOUND_FILES)[keyof typeof SOUND_FILES]
  | (typeof ADHAN_FILES)[AdhanId];

/** A sound a Believer can preview: a tone with a file, or an Adhan. */
export type PreviewSoundId = keyof typeof SOUND_FILES | AdhanId;

/** How long each Adhan recording plays, in seconds. */
export const ADHAN_SECONDS = {
  "hatamzadeh-takbeer": 28.8,
  "hatamzadeh-full": 167.8,
  "sobhdel-takbeer": 28.5,
  "sobhdel-full": 355.2,
} as const satisfies Record<AdhanId, number>;
