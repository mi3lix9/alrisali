import type { AdhanSound } from "@alrisali/domain/reminders";

/** A bundled adhan voice: its catalogue entry and each cut's audio asset. */
interface BundledAdhan {
  sound: AdhanSound;
  /** `require("../../../assets/sounds/<full file>")`. */
  full: number;
  /** `require("../../../assets/sounds/<takbir file>")`. */
  takbir: number;
}

/**
 * The adhan voices installed with the app. Empty: no licensed adhan or
 * takbir recording exists yet (spec 0002, Further Notes), so the takbir
 * plays the system's notification sound and the full adhan is not offered.
 * To add a voice: put both files in `assets/sounds`, list them in
 * `app.config.ts` (`expo-notifications.sounds`, so notifications can play
 * them by name), credit the source in `CONTENT_SOURCES` and add an entry
 * here. Voices downloaded from the content database come with ticket 31.
 */
const BUNDLED_ADHANS: readonly BundledAdhan[] = [];

/** The adhan voices on the device, ready for an At-Time Alert. */
export const INSTALLED_ADHAN_SOUNDS: readonly AdhanSound[] = BUNDLED_ADHANS.map(
  ({ sound }) => sound
);

const ASSETS: Readonly<Record<string, number>> = Object.fromEntries(
  BUNDLED_ADHANS.flatMap(({ sound, full, takbir }) => [
    [sound.full.file, full],
    [sound.takbir.file, takbir],
  ])
);

/** The audio asset of an installed recording, to play it in the app. */
export const adhanAsset = (file: string): number | undefined => ASSETS[file];
