import { findAyah } from "@alrisali/domain/quran";
import type { AyahKey } from "@alrisali/domain/quran";
import { BottomSheet, Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";

import { surahName } from "../utils/format";

interface ReturnHistorySheetProps {
  open: boolean;
  /** Earlier positions, latest first. */
  history: AyahKey[];
  /** Jumps to the position at this index of `history`. */
  onSelect: (index: number) => void;
  onClose: () => void;
}

/** The return chip's last ten positions; choosing one jumps back there. */
export const ReturnHistorySheet = ({
  open,
  history,
  onSelect,
  onClose,
}: ReturnHistorySheetProps) => {
  const { t, i18n } = useTranslation("quran");

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header title={t("navigation.returnHistory")} />
        <BottomSheet.Body className="pb-6">
          {history.length === 0 ? (
            <Text size="sm" muted>
              {t("navigation.returnHistoryEmpty")}
            </Text>
          ) : null}
          {history.map((key, index) => {
            const ayah = findAyah(key);
            return ayah ? (
              <Item
                key={key}
                size="sm"
                accessibilityRole="button"
                testID={`quran-return-${index}`}
                onPress={() => onSelect(index)}
              >
                <Item.Content>
                  <Item.Title>
                    {t("navigation.returnTo", {
                      page: formatNumber(ayah.page),
                    })}
                  </Item.Title>
                  <Item.Description>
                    {t("navigation.ayahRef", {
                      name: surahName(i18n.language, ayah.surah),
                      ayah: formatNumber(ayah.ayah),
                    })}
                  </Item.Description>
                </Item.Content>
              </Item>
            ) : null;
          })}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
