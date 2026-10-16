import { createAdhansRepository } from "@alrisali/db-content/shared";
import { installedAdhanSounds } from "@alrisali/domain/reminders";
import type { AdhanSound } from "@alrisali/domain/reminders";
import { adhanIdOfFile } from "@alrisali/domain/shared";
import type { AdhanCatalogueEntry } from "@alrisali/domain/shared";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";
import { storedUri, useStoredFiles } from "@/shared/lib/downloads/store";

/** Stable while the catalogue is empty or has not loaded. */
const NO_VOICES: readonly AdhanCatalogueEntry[] = [];

/**
 * The adhan voices the Admins published, in their order, from the content
 * replica (refreshed by each pull that brings changes). Empty until the first
 * pull, and while no Admin has published one: no recording is bundled.
 * `undefined` while the replica is being read.
 */
export const useAdhanCatalogue = ():
  | readonly AdhanCatalogueEntry[]
  | undefined => {
  const { data, isError } = useQuery({
    queryKey: [...CONTENT_QUERY_KEY, "adhans"],
    queryFn: async () => {
      const replica = await getContentReplica();
      return createAdhansRepository(replica.db).list();
    },
  });
  return isError ? NO_VOICES : data;
};

/**
 * The voices on the device: published ones the Believer has downloaded, both
 * recordings whole. `undefined` until the catalogue is read, so nothing is
 * planned with the system's sound meanwhile.
 */
export const useInstalledAdhanSounds = ():
  | readonly AdhanSound[]
  | undefined => {
  const catalogue = useAdhanCatalogue();
  const stored = useStoredFiles("adhan");
  return useMemo(
    () => (catalogue ? installedAdhanSounds(catalogue, stored) : undefined),
    [catalogue, stored]
  );
};

/** Where a downloaded recording is, from the name it is stored under; null when it is not on the device. */
export const adhanFileUri = (file: string): string | null => {
  const id = adhanIdOfFile(file);
  return id === null ? null : storedUri("adhan", id, file);
};
