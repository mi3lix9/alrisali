import "../i18n";
import type { AyahKey } from "@alrisali/domain/quran";
import { PencilIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionRow } from "@/shared/ui/action-row";

import { useAyahNotes } from "../data/ayah-notes";
import { AyahNoteSheet } from "./ayah-note-sheet";

/**
 * The ayah sheet's Ayah Note row: writes or edits the ayah's note, and shows
 * a check once it has one.
 */
export const AyahNoteRow = ({ ayah }: { ayah: AyahKey }) => {
  const { t } = useTranslation("quran");
  const notes = useAyahNotes();
  const [editing, setEditing] = useState<AyahKey | null>(null);
  const saved = notes.data?.find((note) => note.ayah === ayah)?.text ?? "";

  return (
    <>
      <ActionRow
        testID="ayah-sheet-note"
        icon={<PencilIcon size={20} />}
        label={saved === "" ? t("notes.add") : t("notes.edit")}
        selected={saved !== ""}
        onPress={() => setEditing(ayah)}
      />
      <AyahNoteSheet
        ayah={editing}
        saved={saved}
        onClose={() => setEditing(null)}
      />
    </>
  );
};
