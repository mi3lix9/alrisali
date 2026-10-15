import type { AyahKey } from "@alrisali/content/quran";
import { findAyah } from "@alrisali/domain/quran";
import { setStringAsync } from "expo-clipboard";
import { BottomSheet, Button, Direction, Text, toast } from "panelui-native";
import { CopyIcon, PlayIcon, ShareNodesIcon } from "panelui-native/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Share, View } from "react-native";

import { sendRecitation } from "../data/recitation-player";
import { QURAN_FONT } from "../hooks/use-quran-font";
import { ayahCopyText, playFromAyah } from "../utils/ayah-actions";
import { formatNumber, surahName } from "../utils/format";

/** Extra actions another feature adds to the sheet, composed by the route. */
export type AyahActions = (ayah: AyahKey) => ReactNode;

interface AyahSheetProps {
  ayah: AyahKey | null;
  /** The reader's reciter, who recites from this ayah on Play. */
  reciterId: number;
  onClose: () => void;
  actions?: AyahActions | undefined;
}

/**
 * An ayah's long-press sheet: its text, which can be selected and copied, and
 * its actions: play recitation from it, copy it, share it, and the route's.
 */
export const AyahSheet = ({
  ayah,
  reciterId,
  onClose,
  actions,
}: AyahSheetProps) => {
  const { t, i18n } = useTranslation("quran");
  const found = ayah ? findAyah(ayah) : undefined;
  const name = found ? surahName(i18n.language, found.surah) : "";
  const title = found
    ? t("sheet.title", {
        surah: name,
        ayah: formatNumber(i18n.language, found.ayah),
      })
    : "";

  const copy = async (key: AyahKey, text: string) => {
    await setStringAsync(
      ayahCopyText({ text, key, surahName: name, language: i18n.language })
    );
    toast.show({ variant: "success", label: t("sheet.copied") });
  };

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
              <View className="flex-row flex-wrap gap-2">
                <Button
                  testID="ayah-sheet-play"
                  variant="outline"
                  startContent={<PlayIcon size={18} />}
                  onPress={() => {
                    sendRecitation(playFromAyah(found.key, reciterId));
                    onClose();
                  }}
                >
                  {t("sheet.play")}
                </Button>
                <Button
                  testID="ayah-sheet-copy"
                  variant="outline"
                  startContent={<CopyIcon size={18} />}
                  onPress={() => copy(found.key, found.text)}
                >
                  {t("sheet.copy")}
                </Button>
                <Button
                  testID="ayah-sheet-share"
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
