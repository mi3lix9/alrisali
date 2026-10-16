import { fileUrl } from "@alrisali/api/shared";
import { createLibraryAssetsRepository } from "@alrisali/db-content/library-assets";
import type {
  LibraryAsset,
  StructuredTextBlock,
} from "@alrisali/domain/library-assets";
import {
  structuredTextBlocks,
  structuredTextSchema,
} from "@alrisali/domain/library-assets";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";
import { ENV } from "@/src/env";

const LIBRARY_ASSETS_QUERY_KEY = [...CONTENT_QUERY_KEY, "library-assets"];

const listLibraryAssets = async (): Promise<LibraryAsset[]> => {
  const replica = await getContentReplica();
  return createLibraryAssetsRepository(replica.db).list();
};

/**
 * Every published Library Asset on the device, in the Admins' order (empty
 * until the first pull). The replica holds only published ones.
 */
export const useLibraryAssets = () =>
  useQuery({ queryKey: LIBRARY_ASSETS_QUERY_KEY, queryFn: listLibraryAssets });

/** One Library Asset; `null` once it is unpublished or removed. */
export const useLibraryAsset = (id: string) =>
  useQuery({
    queryKey: LIBRARY_ASSETS_QUERY_KEY,
    queryFn: listLibraryAssets,
    select: (assets) => assets.find((asset) => asset.id === id) ?? null,
  });

/** Where an uploaded file loads from (the server redirects to the bucket). */
export const libraryFileUrl = (key: string): string =>
  fileUrl(ENV.EXPO_PUBLIC_SERVER_URL, key);

/**
 * A structured-text Library Asset's titles and passages. A file never
 * changes under its key, so it is read once per session.
 */
export const useStructuredText = (fileKey: string) =>
  useQuery({
    queryKey: ["library-assets", "structured-text", fileKey],
    queryFn: async (): Promise<StructuredTextBlock[]> => {
      const response = await fetch(libraryFileUrl(fileKey));
      if (!response.ok) {
        throw new Error(`Library Asset file ${fileKey}: ${response.status}`);
      }
      return structuredTextBlocks(
        structuredTextSchema.parse(await response.json())
      );
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
