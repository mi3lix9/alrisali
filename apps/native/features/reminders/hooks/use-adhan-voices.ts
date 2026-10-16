import type { AdhanSound } from "@alrisali/domain/reminders";
import {
  adhanFilesToDownload,
  isAdhanDownloaded,
} from "@alrisali/domain/shared";
import type { AdhanCatalogueEntry, StoredFile } from "@alrisali/domain/shared";

import { useStoredFiles } from "@/shared/lib/downloads/store";

import {
  useAdhanCatalogue,
  useInstalledAdhanSounds,
} from "../data/adhan-catalogue";

/** Stable while the catalogue has not loaded. */
const NONE: readonly never[] = [];

export interface AdhanVoices {
  /** Every voice the Admins published, in their order. */
  catalogue: readonly AdhanCatalogueEntry[];
  /** The voices on the device, ready for an At-Time Alert. */
  installed: readonly AdhanSound[];
  stored: readonly StoredFile[];
  isDownloaded: (entry: AdhanCatalogueEntry) => boolean;
  /** Bytes still to download for a voice. */
  bytesToDownload: (entry: AdhanCatalogueEntry) => number;
}

/** The adhan catalogue with what of it is on this device. */
export const useAdhanVoices = (): AdhanVoices => {
  const catalogue = useAdhanCatalogue() ?? NONE;
  const installed = useInstalledAdhanSounds() ?? NONE;
  const stored = useStoredFiles("adhan");
  return {
    catalogue,
    installed,
    stored,
    isDownloaded: (entry) => isAdhanDownloaded(entry, stored),
    bytesToDownload: (entry) =>
      adhanFilesToDownload(entry, stored).reduce(
        (sum, file) => sum + file.bytes,
        0
      ),
  };
};
