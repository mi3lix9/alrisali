import "../i18n";
import type { AyahKey, TextSelection } from "@alrisali/domain/quran";
import {
  AYAH_NOTE_MAX,
  findAyah,
  insertAtCursor,
} from "@alrisali/domain/quran";
import { BottomSheet, Button, Input } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber, useDigits } from "@/shared/lib/numbers";

import { useChangeAyahNote } from "../data/ayah-notes";
import { ayahCopyText } from "../utils/ayah-actions";
import { surahName } from "../utils/format";

interface NoteFormProps {
  ayah: AyahKey;
  /** The note as saved; empty when the ayah has none. */
  saved: string;
  onDone: () => void;
}

const NoteForm = ({ ayah, saved, onDone }: NoteFormProps) => {
  const { t, i18n } = useTranslation("quran");
  const digits = useDigits();
  const change = useChangeAyahNote();
  const [text, setText] = useState(saved);
  const [selection, setSelection] = useState<TextSelection>({
    start: saved.length,
    end: saved.length,
  });
  const found = findAyah(ayah);

  const insertAyah = () => {
    if (!found) {
      return;
    }
    const inserted = insertAtCursor(
      text,
      selection,
      ayahCopyText({
        text: found.text,
        key: found.key,
        surahName: surahName(i18n.language, found.surah),
        digits,
      })
    );
    setText(inserted.text);
    setSelection(inserted.selection);
  };

  const save = () => {
    change.mutate({ type: "write", ayah, text });
    onDone();
  };

  const remove = () => {
    change.mutate({ type: "remove", ayah });
    onDone();
  };

  return (
    <View className="gap-4">
      <Input
        testID="quran-note-input"
        label={t("notes.field")}
        value={text}
        onChangeText={setText}
        selection={selection}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
        placeholder={t("notes.placeholder")}
        maxLength={AYAH_NOTE_MAX}
        multiline
        autoFocus
        style={{ minHeight: 120, textAlignVertical: "top" }}
      />
      <Button testID="quran-note-insert" variant="outline" onPress={insertAyah}>
        {t("notes.insert")}
      </Button>
      <Button testID="quran-note-save" onPress={save}>
        {t("notes.save")}
      </Button>
      {saved === "" ? null : (
        <Button testID="quran-note-delete" variant="outline" onPress={remove}>
          {t("notes.delete")}
        </Button>
      )}
    </View>
  );
};

interface AyahNoteSheetProps {
  /** The ayah whose note is edited; null keeps the sheet closed. */
  ayah: AyahKey | null;
  /** The ayah's saved note; empty when it has none. */
  saved: string;
  onClose: () => void;
}

/**
 * Writes an ayah's one Ayah Note, with a button that puts the ayah's text
 * and reference at the cursor.
 */
export const AyahNoteSheet = ({ ayah, saved, onClose }: AyahNoteSheetProps) => {
  const { t, i18n } = useTranslation("quran");
  const found = ayah ? findAyah(ayah) : undefined;

  return (
    <BottomSheet
      open={ayah !== null}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header
          title={
            found
              ? t("notes.title", {
                  surah: surahName(i18n.language, found.surah),
                  ayah: formatNumber(found.ayah),
                })
              : ""
          }
        />
        <BottomSheet.Body className="pb-6" keyboardShouldPersistTaps="handled">
          {/* Mounted per opening, so the field starts at the saved note. */}
          {ayah ? (
            <NoteForm ayah={ayah} saved={saved} onDone={onClose} />
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
