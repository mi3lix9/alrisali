import { createQuranRibbonsRepository } from "@alrisali/db-user/quran";
import type {
  AyahKey,
  BookmarkRibbon,
  RibbonColor,
} from "@alrisali/domain/quran";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const RIBBONS_KEY = [...USER_DATA_QUERY_KEY, "quran", "ribbons"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createQuranRibbonsRepository(db);
};

/** The six Bookmark Ribbons, in colour order, unused ones included. */
export const useRibbons = () =>
  useQuery({
    queryKey: RIBBONS_KEY,
    queryFn: async (): Promise<BookmarkRibbon[]> => {
      const ribbons = await repository();
      return ribbons.list();
    },
  });

type RibbonChange =
  | { type: "move"; color: RibbonColor; ayah: AyahKey }
  | { type: "clear"; color: RibbonColor }
  | { type: "rename"; color: RibbonColor; name: string };

/**
 * Moves, clears or renames a ribbon. The ayah sheet, the page's rosettes
 * and the Saved list follow once it is written.
 */
export const useChangeRibbon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: RibbonChange) => {
      const ribbons = await repository();
      switch (change.type) {
        case "move": {
          await ribbons.move(change.color, change.ayah);
          break;
        }
        case "clear": {
          await ribbons.clear(change.color);
          break;
        }
        case "rename": {
          await ribbons.rename(change.color, change.name);
          break;
        }
        default: {
          break;
        }
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: RIBBONS_KEY });
    },
  });
};
