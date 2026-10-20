import { createRecitationCache, withDownloads } from "@alrisali/domain/quran";
import type {
  CachedRecitation,
  RecitationCacheStore,
} from "@alrisali/domain/quran";
import { Directory, File, Paths } from "expo-file-system";

import { downloadedRecitations } from "./recitation-downloads";

// Played recitation files in the app's cache directory, one folder per
// reciter: `recitation/ar.alafasy/002255.mp3`. A file's modification time is
// when it was downloaded; files under an older app's numeric reciter folders
// expire with the rest.

const root = new Directory(Paths.cache, "recitation");

const fileFor = (key: string) => new File(root, `${key}.mp3`);

const entryFor = (key: string, file: File): CachedRecitation | null =>
  file.exists && file.modificationTime !== null
    ? { key, uri: file.uri, savedAt: file.modificationTime }
    : null;

const fileStore: RecitationCacheStore = {
  get: (key) => Promise.resolve(entryFor(key, fileFor(key))),
  list: () => {
    if (!root.exists) {
      return Promise.resolve([]);
    }
    const entries: CachedRecitation[] = [];
    for (const reciter of root.list()) {
      if (reciter instanceof Directory) {
        for (const file of reciter.list()) {
          const entry =
            file instanceof File
              ? entryFor(
                  `${reciter.name}/${file.name.replace(/\.mp3$/u, "")}`,
                  file
                )
              : null;
          if (entry) {
            entries.push(entry);
          }
        }
      }
    }
    return Promise.resolve(entries);
  },
  save: async (key, url) => {
    const file = fileFor(key);
    file.parentDirectory.create({ intermediates: true, idempotent: true });
    await File.downloadFileAsync(url, file, { idempotent: true });
  },
  remove: (key) => {
    const file = fileFor(key);
    if (file.exists) {
      file.delete();
    }
    return Promise.resolve();
  },
};

/**
 * Played recitation, kept on the device for at most 7 days; an ayah the
 * Believer downloaded plays from its download, which is never pruned.
 */
export const recitationCache = withDownloads(
  createRecitationCache({ store: fileStore }),
  downloadedRecitations
);
