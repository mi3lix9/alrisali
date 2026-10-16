import { DOWNLOAD_KINDS } from "@alrisali/domain/shared";
import type { DownloadKind, StoredFile } from "@alrisali/domain/shared";
import { Directory, File, Paths } from "expo-file-system";
import { create } from "zustand";

// Files the Believer chose to keep, apart from the 7-day cache: they live in
// the app's document directory, `downloads/<kind>/<group>/<name>`, where
// `group` is a reciter or an adhan. Every kind (recitation, adhans) uses this
// one store, so the Storage screen lists them all. A file still downloading is
// a `.part` file beside its place and is not listed.

const root = new Directory(Paths.document, "downloads");

const kindDirectory = (kind: DownloadKind) => new Directory(root, kind);
const groupDirectory = (kind: DownloadKind, group: string) =>
  new Directory(kindDirectory(kind), group);

/** Bumped on every change, so what shows the stored files reads them again. */
const useRevision = create<{ revision: number }>(() => ({ revision: 0 }));
const bump = () =>
  useRevision.setState((state) => ({ revision: state.revision + 1 }));

/** A download of the whole Quran stores thousands of files: its changes are announced at most twice a second. */
const THROTTLE_MS = 500;
let announcing: ReturnType<typeof setTimeout> | null = null;
const changed = ({ now = false } = {}) => {
  if (now) {
    if (announcing) {
      clearTimeout(announcing);
      announcing = null;
    }
    bump();
  } else if (!announcing) {
    announcing = setTimeout(() => {
      announcing = null;
      bump();
    }, THROTTLE_MS);
  }
};

/** The file a download is written to, then moved to its place by `commit`. */
export const partFile = (kind: DownloadKind, group: string, name: string) =>
  new File(groupDirectory(kind, group), `${name}.part`);

const finalFile = (kind: DownloadKind, group: string, name: string) =>
  new File(groupDirectory(kind, group), name);

/** Makes the folder a download will be written into. */
export const prepareGroup = (kind: DownloadKind, group: string): void => {
  groupDirectory(kind, group).create({ intermediates: true, idempotent: true });
};

/** Moves a finished download into its place, replacing an older copy. */
export const commitDownload = async (
  kind: DownloadKind,
  group: string,
  name: string
): Promise<void> => {
  const part = partFile(kind, group, name);
  const file = finalFile(kind, group, name);
  if (file.exists) {
    file.delete();
  }
  await part.move(file);
  changed();
};

/** Deletes what a download wrote so far. */
export const discardPartial = (
  kind: DownloadKind,
  group: string,
  name: string
): void => {
  const part = partFile(kind, group, name);
  if (part.exists) {
    part.delete();
  }
};

/** Where a stored file is, or null when it is not downloaded. */
export const storedUri = (
  kind: DownloadKind,
  group: string,
  name: string
): string | null => {
  const file = finalFile(kind, group, name);
  return file.exists ? file.uri : null;
};

/** Every stored file, optionally of one kind. */
export const listStored = (kind?: DownloadKind): StoredFile[] => {
  const files: StoredFile[] = [];
  for (const current of kind ? [kind] : DOWNLOAD_KINDS) {
    const directory = kindDirectory(current);
    if (!directory.exists) {
      continue;
    }
    for (const group of directory.list()) {
      if (!(group instanceof Directory)) {
        continue;
      }
      for (const file of group.list()) {
        if (file instanceof File && !file.name.endsWith(".part")) {
          files.push({
            kind: current,
            group: group.name,
            name: file.name,
            bytes: file.size,
          });
        }
      }
    }
  }
  return files;
};

/** Deletes one stored file. */
export const removeStored = (
  kind: DownloadKind,
  group: string,
  name: string
): void => {
  const file = finalFile(kind, group, name);
  if (file.exists) {
    file.delete();
  }
  changed({ now: true });
};

/** Deletes everything stored for a group: a reciter's audio, an adhan. */
export const removeStoredGroup = (kind: DownloadKind, group: string): void => {
  const directory = groupDirectory(kind, group);
  if (directory.exists) {
    directory.delete();
  }
  changed({ now: true });
};

const listed = new Map<
  DownloadKind | "all",
  { revision: number; files: StoredFile[] }
>();

/** The stored files, read again when one is added or removed; the same array until then. */
export const useStoredFiles = (kind?: DownloadKind): StoredFile[] => {
  const revision = useRevision((state) => state.revision);
  const key = kind ?? "all";
  let entry = listed.get(key);
  if (entry?.revision !== revision) {
    entry = { revision, files: listStored(kind) };
    listed.set(key, entry);
  }
  return entry.files;
};
