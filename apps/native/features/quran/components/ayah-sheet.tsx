import type { AyahKey } from "@alrisali/content/quran";
import { findAyah, nextAyah, previousAyah } from "@alrisali/domain/quran";
import { setStringAsync } from "expo-clipboard";
import { BottomSheet, Button, Direction, Text, toast } from "panelui-native";
import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PlayIcon,
  ShareNodesIcon,
} from "panelui-native/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Share, View } from "react-native";

import { launchDirection } from "@/shared/lib/i18n";
import { formatNumber, useDigits } from "@/shared/lib/numbers";
import { ActionRow } from "@/shared/ui/action-row";

import { sendRecitation } from "../data/recitation-player";
import { QURAN_FONT } from "../hooks/use-quran-font";
import { ayahCopyText, playFromAyah } from "../utils/ayah-actions";
import { surahName } from "../utils/format";

/** Rows or cards another feature draws for the ayah the sheet shows. */
export type AyahSlot = (ayah: AyahKey) => ReactNode;

/**
 * What other features add to the ayah sheet, composed by the route. The
 * sheet's order is fixed: Set as Last-Read, Play, Play To, `keep`, Copy,
 * Share (text), `share`. Each slot holds rows (`ActionRow`) in the order the
 * route lists them.
 */
export interface AyahActions {
  /** Above the actions, under the ayah's text: e.g. a Khatmah portion's end. */
  banner?: AyahSlot;
  /** After Play To: Favorite, then Bookmark Ribbon, then Ayah Note. */
  keep?: AyahSlot;
  /** After Share (text): other ways to share, e.g. as an image. */
  share?: AyahSlot;
}

export type AyahSheetMove = "previous" | "next";

interface AyahSheetProps {
  ayah: AyahKey | null;
  /** The reader's reciter, who recites from this ayah on Play. */
  reciter: string;
  lastReadAyah: AyahKey | null;
  onSetLastRead: (ayah: AyahKey) => void;
  /** The header arrows: the sheet moves to the neighbouring ayah. */
  onMove: (direction: AyahSheetMove) => void;
  onClose: () => void;
  actions?: AyahActions | undefined;
}

/**
 * An ayah's long-press sheet: arrows to its neighbours, its text (which can
 * be selected and copied) and a vertical list of its actions.
 */
export const AyahSheet = ({
  ayah,
  reciter,
  lastReadAyah,
  onSetLastRead,
  onMove,
  onClose,
  actions,
}: AyahSheetProps) => {
  const { t, i18n } = useTranslation("quran");
  const digits = useDigits();
  const found = ayah ? findAyah(ayah) : undefined;
  const name = found ? surahName(i18n.language, found.surah) : "";
  // The arrows point the way the text runs: in Arabic, onward is leftward.
  const [PreviousIcon, NextIcon] =
    launchDirection === "rtl"
      ? [ChevronRightIcon, ChevronLeftIcon]
      : [ChevronLeftIcon, ChevronRightIcon];

  const header = found ? (
    <View className="flex-row items-center gap-2">
      <Button
        testID="ayah-sheet-previous"
        variant="ghost"
        size="icon"
        accessibilityLabel={t("sheet.previous")}
        disabled={previousAyah(found.key) === null}
        onPress={() => onMove("previous")}
      >
        <PreviousIcon size={20} />
      </Button>
      <View className="flex-1 items-center">
        <Text weight="semibold" accessibilityRole="header">
          {t("sheet.title", { surah: name, ayah: formatNumber(found.ayah) })}
        </Text>
        <Text size="xs" muted>
          {t("chrome.position", {
            juz: formatNumber(found.juz),
            page: formatNumber(found.page),
          })}
        </Text>
      </View>
      <Button
        testID="ayah-sheet-next"
        variant="ghost"
        size="icon"
        accessibilityLabel={t("sheet.next")}
        disabled={nextAyah(found.key) === null}
        onPress={() => onMove("next")}
      >
        <NextIcon size={20} />
      </Button>
    </View>
  ) : null;

  // Copy and Share both send the text with its reference.
  const withReference = found
    ? ayahCopyText({
        text: found.text,
        key: found.key,
        surahName: name,
        digits,
      })
    : "";

  const copy = async () => {
    await setStringAsync(withReference);
    toast.show({ variant: "success", label: t("sheet.copied") });
  };

  const isLastRead = found !== undefined && lastReadAyah === found.key;

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
        <BottomSheet.Header title={header} />
        <BottomSheet.Body>
          {found ? (
            <View className="gap-4 pb-4">
              {actions?.banner?.(found.key)}
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
              <View className="gap-2">
                <ActionRow
                  testID="ayah-sheet-last-read"
                  icon={<BookmarkIcon size={20} filled={isLastRead} />}
                  label={isLastRead ? t("lastRead.isSet") : t("lastRead.set")}
                  selected={isLastRead}
                  disabled={isLastRead}
                  onPress={() => onSetLastRead(found.key)}
                />
                <ActionRow
                  testID="ayah-sheet-play"
                  icon={<PlayIcon size={20} />}
                  label={t("sheet.play")}
                  onPress={() => {
                    sendRecitation(playFromAyah(found.key, reciter));
                    onClose();
                  }}
                />
                {actions?.keep?.(found.key)}
                <ActionRow
                  testID="ayah-sheet-copy"
                  icon={<CopyIcon size={20} />}
                  label={t("sheet.copy")}
                  onPress={copy}
                />
                <ActionRow
                  testID="ayah-sheet-share"
                  icon={<ShareNodesIcon size={20} />}
                  label={t("sheet.share")}
                  onPress={() => Share.share({ message: withReference })}
                />
                {actions?.share?.(found.key)}
              </View>
            </View>
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
