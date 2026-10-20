import {
  missingAyat,
  recitationFile,
  recitationUrl,
  scopeAyat,
  scopeJobId,
} from "@alrisali/domain/quran";
import type {
  DownloadedRecitations,
  DownloadScope,
} from "@alrisali/domain/quran";
import { useMemo } from "react";

import { cancelDownload, startDownload } from "@/shared/lib/downloads/runner";
import {
  removeStoredGroup,
  storedUri,
  useStoredFiles,
} from "@/shared/lib/downloads/store";

// Recitation the Believer downloaded on purpose, kept in the downloads store
// (`recitation/<reciter>/<sssaaa>.mp3`) apart from the 7-day cache: playing
// prefers these files, and the cache never prunes them.

const KIND = "recitation";

/** Where the downloaded file for `<reciter>/<sssaaa>` is, or null. */
export const downloadedRecitations: DownloadedRecitations = {
  uri: (key) => {
    const slash = key.lastIndexOf("/");
    return Promise.resolve(
      storedUri(KIND, key.slice(0, slash), `${key.slice(slash + 1)}.mp3`)
    );
  },
};

export interface DownloadedRecitationSummary {
  /** The keys (`<reciter>/<sssaaa>`) of every downloaded ayah. */
  keys: ReadonlySet<string>;
  bytesByReciter: ReadonlyMap<string, number>;
}

/** What is downloaded now, read again as files come and go. */
export const useDownloadedRecitation = (): DownloadedRecitationSummary => {
  const files = useStoredFiles(KIND);
  return useMemo(() => {
    const keys = new Set<string>();
    const bytesByReciter = new Map<string, number>();
    for (const file of files) {
      keys.add(`${file.group}/${file.name.replace(/\.mp3$/u, "")}`);
      bytesByReciter.set(
        file.group,
        (bytesByReciter.get(file.group) ?? 0) + file.bytes
      );
    }
    return { keys, bytesByReciter };
  }, [files]);
};

/** Downloads what a reciter has not got of a scope; Wi-Fi only decides when it runs. */
export const downloadRecitation = (
  reciter: string,
  scope: DownloadScope,
  have: ReadonlySet<string>
): void => {
  const missing = missingAyat(reciter, scope, have);
  startDownload({
    id: scopeJobId(reciter, scope),
    kind: KIND,
    group: reciter,
    files: missing.map((ayah) => ({
      name: recitationFile(reciter, ayah).name,
      url: recitationUrl(reciter, ayah),
    })),
    alreadyDone: scopeAyat(scope).length - missing.length,
  });
};

/** Deletes a reciter's downloads, stopping any still running. */
export const deleteReciterDownloads = (
  reciter: string,
  jobIds: readonly string[]
): void => {
  for (const id of jobIds) {
    cancelDownload(id);
  }
  removeStoredGroup(KIND, reciter);
};
