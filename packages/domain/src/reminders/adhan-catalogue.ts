import type { AdhanCatalogueEntry, StoredFile } from "../shared";
import { adhanFileName, isAdhanDownloaded } from "../shared";
import type { AdhanSound } from "./adhan-sounds";
import { SYSTEM_SOUND_ID } from "./settings";

// Which catalogue voices are installed: the ones the Believer has downloaded.

/** The catalogue voices on the device, ready for an At-Time Alert. */
export const installedAdhanSounds = (
  catalogue: readonly AdhanCatalogueEntry[],
  stored: readonly StoredFile[]
): AdhanSound[] =>
  catalogue
    .filter((entry) => isAdhanDownloaded(entry, stored))
    .map(({ id, name, credit, full, takbir }) => ({
      id,
      name,
      credit,
      full: {
        file: adhanFileName({ id, full, takbir }, "full"),
        seconds: full.seconds,
        bytes: full.bytes,
      },
      takbir: {
        file: adhanFileName({ id, full, takbir }, "takbir"),
        seconds: takbir.seconds,
        bytes: takbir.bytes,
      },
    }));

/**
 * A voice can be the At-Time sound only once it is downloaded; the system's
 * sound always can. An undownloaded choice is replaced by the system's sound.
 */
export const selectableAdhanSound = (
  adhanSound: string,
  installed: readonly AdhanSound[]
): string =>
  installed.some(({ id }) => id === adhanSound) ? adhanSound : SYSTEM_SOUND_ID;
