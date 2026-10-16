import { fileUrl } from "@alrisali/api/shared";
import { ADHAN_CUTS, adhanFilesToDownload } from "@alrisali/domain/shared";
import type { AdhanCatalogueEntry, StoredFile } from "@alrisali/domain/shared";

import { cancelDownload, startDownload } from "@/shared/lib/downloads/runner";
import { removeStoredGroup } from "@/shared/lib/downloads/store";
import { ENV } from "@/src/env";

// Adhans the Believer downloaded on purpose, kept in the downloads store
// (`adhan/<voice id>/adhan-<voice id>-<cut>.<ext>`), so the Storage screen
// lists and deletes them with the rest. Wi-Fi only decides when it runs.

const KIND = "adhan";

/** The download job of a voice. */
export const adhanJobId = (id: string): string => `adhan:${id}`;

/** Downloads the recordings of a voice that are not on the device. */
export const downloadAdhan = (
  entry: AdhanCatalogueEntry,
  stored: readonly StoredFile[]
): void => {
  const missing = adhanFilesToDownload(entry, stored);
  startDownload({
    id: adhanJobId(entry.id),
    kind: KIND,
    group: entry.id,
    files: missing.map(({ name, key }) => ({
      name,
      url: fileUrl(ENV.EXPO_PUBLIC_SERVER_URL, key),
    })),
    alreadyDone: ADHAN_CUTS.length - missing.length,
  });
};

/** Deletes a voice from the device, stopping its download if it is running. */
export const deleteAdhan = (id: string): void => {
  cancelDownload(adhanJobId(id));
  removeStoredGroup(KIND, id);
};
