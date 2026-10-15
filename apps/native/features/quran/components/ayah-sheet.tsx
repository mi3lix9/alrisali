import { SURAHS } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/content/quran";
import { findAyah } from "@alrisali/domain/quran";
import { BottomSheet, Button, Direction, Text } from "panelui-native";
import { ShareNodesIcon } from "panelui-native/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Share, View } from "react-native";

import { QURAN_FONT } from "../hooks/use-quran-font";
import { formatNumber } from "../utils/format";

/** Extra actions another feature adds to the sheet, composed by the route. */
export type AyahActions = (ayah: AyahKey) => ReactNode;

interface AyahSheetProps {
  ayah: AyahKey | null;
  onClose: () => void;
  actions?: AyahActions | undefined;
}

/**
 * An ayah's long-press sheet: its text, which can be selected and copied, and
 * its actions.
 */
export const AyahSheet = ({ ayah, onClose, actions }: AyahSheetProps) => {
  const { t, i18n } = useTranslation("quran");
  const found = ayah ? findAyah(ayah) : undefined;
  const surah = found ? SURAHS[found.surah - 1] : undefined;
  const title =
    found && surah
      ? t("sheet.title", {
          surah: i18n.language === "ar" ? surah.nameAr : surah.nameEn,
          ayah: formatNumber(i18n.language, found.ayah),
        })
      : "";

  return (
    <BottomSheet
      open={found !== undefined}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header title={title} />
        <BottomSheet.Body>
          {found ? (
            <View className="gap-4 pb-4">
              <Direction dir="rtl">
                <Text
                  selectable
                  accessibilityLanguage="ar"
                  style={{
                    fontFamily: QURAN_FONT,
                    fontSize: 24,
                    lineHeight: 48,
                  }}
                >
                  {found.text}
                </Text>
              </Direction>
              <Text size="xs" muted>
                {t("sheet.copyHint")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Button
                  variant="outline"
                  startContent={<ShareNodesIcon size={18} />}
                  onPress={() =>
                    Share.share({ message: `${found.text}\n${title}` })
                  }
                >
                  {t("sheet.share")}
                </Button>
                {actions?.(found.key)}
              </View>
            </View>
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
