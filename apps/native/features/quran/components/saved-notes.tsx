import "../i18n";
import type { JumpTarget } from "@alrisali/domain/quran";
import { findAyah } from "@alrisali/domain/quran";
import { Card, Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { useAyahNotes } from "../data/ayah-notes";
import { surahName } from "../utils/format";

interface SavedNotesProps {
  onSelect: (target: JumpTarget) => void;
}

/** The Saved tab's Notes: every Ayah Note in mushaf order; tapping opens its ayah. */
export const SavedNotes = ({ onSelect }: SavedNotesProps) => {
  const { t, i18n } = useTranslation("quran");
  const notes = useAyahNotes().data ?? [];

  if (notes.length === 0) {
    return (
      <Card testID="quran-saved-notes-empty">
        <Card.Content className="items-center pt-6">
          <Text size="sm" muted className="text-center">
            {t("notes.empty")}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View className="gap-2" testID="quran-saved-notes">
      {notes.map((note) => {
        const ayah = findAyah(note.ayah);
        return (
          <Item
            key={note.ayah}
            size="sm"
            variant="outline"
            testID={`quran-saved-note-${note.ayah}`}
            accessibilityRole="button"
            accessibilityHint={t("notes.open")}
            onPress={() => onSelect({ ayah: note.ayah })}
          >
            <Item.Content>
              <Item.Title>
                {ayah
                  ? t("notes.on", {
                      surah: surahName(i18n.language, ayah.surah),
                      ayah: formatNumber(ayah.ayah),
                    })
                  : note.ayah}
              </Item.Title>
              <Item.Description numberOfLines={3}>{note.text}</Item.Description>
            </Item.Content>
          </Item>
        );
      })}
    </View>
  );
};
