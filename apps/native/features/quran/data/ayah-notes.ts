import { createQuranAyahNotesRepository } from "@alrisali/db-user/quran";
import type { AyahKey, AyahNote } from "@alrisali/domain/quran";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const NOTES_KEY = [...USER_DATA_QUERY_KEY, "quran", "ayah-notes"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createQuranAyahNotesRepository(db);
};

/** Every Ayah Note, in mushaf order. */
export const useAyahNotes = () =>
  useQuery({
    queryKey: NOTES_KEY,
    queryFn: async (): Promise<AyahNote[]> => {
      const notes = await repository();
      return notes.list();
    },
  });

type NoteChange =
  | { type: "write"; ayah: AyahKey; text: string }
  | { type: "remove"; ayah: AyahKey };

/**
 * Writes (replacing the ayah's note; blank deletes it) or removes a note.
 * The rosette badge, the ayah sheet and Saved › Notes follow once it is
 * written.
 */
export const useChangeAyahNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: NoteChange) => {
      const notes = await repository();
      await (change.type === "write"
        ? notes.write(change.ayah, change.text)
        : notes.remove(change.ayah));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
};
