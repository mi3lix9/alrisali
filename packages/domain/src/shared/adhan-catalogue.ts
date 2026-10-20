import { z } from "zod";

import type { StoredFile } from "./downloads";
import { fileKeySchema } from "./files";

// The adhan catalogue Admins publish in the content database. A voice is
// listed there with its two recordings, but only a voice the Believer has
// downloaded (both files, complete) is installed: the At-Time Alert never
// depends on the network at the Prayer Time. Shared because the devices
// (Reminders, Storage) and the Admins' catalogue both use it.

/** The two recordings of a voice. */
export const ADHAN_CUTS = ["full", "takbir"] as const;
export type AdhanCut = (typeof ADHAN_CUTS)[number];

/** Where an uploaded adhan recording is kept, by cut (`UPLOAD_RULES` purposes). */
export const ADHAN_UPLOAD_PURPOSES = {
  full: "adhan-full",
  takbir: "adhan-takbir",
} as const satisfies Record<AdhanCut, string>;

/**
 * iOS plays at most 30 seconds of a notification sound, so a takbir cut must
 * fit in it.
 */
export const MAX_TAKBIR_SECONDS = 30;

export const ADHAN_ID_MAX_LENGTH = 64;

/**
 * The id of the Reminders' system sound (`SYSTEM_SOUND_ID`), which no
 * catalogue voice may take.
 */
const SYSTEM_SOUND = "system";

/** A catalogue voice's id. */
export const adhanCatalogueIdSchema = z
  .string()
  .min(1)
  .max(ADHAN_ID_MAX_LENGTH)
  .regex(/^[a-z\d-]+$/u)
  .refine((id) => id !== SYSTEM_SOUND);

const recordedFile = z.object({
  /** The recording's key in the files bucket. */
  key: fileKeySchema,
  seconds: z.number().positive(),
  /** The file's size in bytes: what a complete download weighs. */
  bytes: z.number().int().positive(),
});

/** What Admins edit for one voice of the catalogue. */
export const adhanCatalogueFieldsSchema = z.object({
  name: z.object({
    ar: z.string().trim().min(1),
    en: z.string().trim().min(1),
  }),
  /** Who recorded it and under what licence. */
  credit: z.string().trim(),
  full: recordedFile.refine(
    ({ key }) => key.startsWith(`${ADHAN_UPLOAD_PURPOSES.full}/`),
    {
      message: "The full adhan was not uploaded as a full adhan",
      path: ["key"],
    }
  ),
  takbir: recordedFile
    .extend({ seconds: z.number().positive().max(MAX_TAKBIR_SECONDS) })
    .refine(({ key }) => key.startsWith(`${ADHAN_UPLOAD_PURPOSES.takbir}/`), {
      message: "The takbir was not uploaded as a takbir",
      path: ["key"],
    }),
});

/** One voice of the adhan catalogue, in the Admins' order. */
export const adhanCatalogueEntrySchema = adhanCatalogueFieldsSchema.extend({
  id: adhanCatalogueIdSchema,
});

export type AdhanCatalogueEntry = z.infer<typeof adhanCatalogueEntrySchema>;

const extensionOf = (key: string): string =>
  key.slice(key.lastIndexOf(".") + 1);

/**
 * The name a recording is stored under on the device (group: the voice's id).
 * It is unique across voices, so the name alone says whose file it is, and
 * the notification sound named after it cannot clash.
 */
export const adhanFileName = (
  entry: Pick<AdhanCatalogueEntry, "id" | "full" | "takbir">,
  cut: AdhanCut
): string => `adhan-${entry.id}-${cut}.${extensionOf(entry[cut].key)}`;

const FILE_NAME = /^adhan-(?<id>[a-z\d-]+)-(?:full|takbir)\.[a-z\d]+$/u;

/** The voice a stored recording's name belongs to, or null for any other name. */
export const adhanIdOfFile = (file: string): string | null =>
  FILE_NAME.exec(file)?.groups?.id ?? null;

/** The files a voice needs on the device, with their keys and sizes. */
export const adhanFiles = (
  entry: AdhanCatalogueEntry
): { cut: AdhanCut; name: string; key: string; bytes: number }[] =>
  ADHAN_CUTS.map((cut) => ({
    cut,
    name: adhanFileName(entry, cut),
    key: entry[cut].key,
    bytes: entry[cut].bytes,
  }));

const hasStored = (
  stored: readonly StoredFile[],
  id: string,
  name: string,
  bytes: number
): boolean =>
  stored.some(
    (file) =>
      file.kind === "adhan" &&
      file.group === id &&
      file.name === name &&
      file.bytes === bytes
  );

/**
 * Whether the voice is on the device: both recordings are stored at the size
 * the catalogue states (a recording an Admin replaced is not, until it is
 * downloaded again).
 */
export const isAdhanDownloaded = (
  entry: AdhanCatalogueEntry,
  stored: readonly StoredFile[]
): boolean =>
  adhanFiles(entry).every(({ name, bytes }) =>
    hasStored(stored, entry.id, name, bytes)
  );

/** The files of a voice still to download. */
export const adhanFilesToDownload = (
  entry: AdhanCatalogueEntry,
  stored: readonly StoredFile[]
) =>
  adhanFiles(entry).filter(
    ({ name, bytes }) => !hasStored(stored, entry.id, name, bytes)
  );
