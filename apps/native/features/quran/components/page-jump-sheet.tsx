import { PAGE_COUNT, pagePosition, parsePage } from "@alrisali/domain/quran";
import type { JumpTarget } from "@alrisali/domain/quran";
import { BottomSheet, Button, Input, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { localizeDigits } from "@/shared/lib/numbers";

import { surahName } from "../utils/format";

interface PageJumpFormProps {
  initialPage: number;
  onSelect: (target: JumpTarget) => void;
}

export const PageJumpForm = ({ initialPage, onSelect }: PageJumpFormProps) => {
  const { t, i18n } = useTranslation("quran");
  // Starts in the interface's digits; parsePage reads Western or
  // Arabic-Indic, whichever the keyboard types.
  const [text, setText] = useState(localizeDigits(String(initialPage)));
  const page = parsePage(text);
  const position = page ? pagePosition(page) : null;
  const open = () => {
    if (page) {
      onSelect({ page });
    }
  };

  return (
    <View className="gap-4">
      <Input
        testID="quran-page-jump-input"
        label={t("navigation.pageNumber", { first: 1, last: PAGE_COUNT })}
        value={text}
        onChangeText={setText}
        keyboardType="number-pad"
        returnKeyType="go"
        maxLength={String(PAGE_COUNT).length}
        selectTextOnFocus
        autoFocus
        onSubmitEditing={open}
        {...(text.trim() && !page
          ? {
              errorMessage: t("navigation.pageInvalid", {
                first: 1,
                last: PAGE_COUNT,
              }),
            }
          : {})}
      />
      <Text size="sm" muted accessibilityLiveRegion="polite">
        {position
          ? t("navigation.pagePreview", {
              name: surahName(i18n.language, position.surah),
              juz: position.juz,
            })
          : " "}
      </Text>
      <Button testID="quran-page-jump-open" disabled={!page} onPress={open}>
        {t("navigation.open")}
      </Button>
    </View>
  );
};

interface PageJumpSheetProps {
  open: boolean;
  /** The page the field starts at: the one in view. */
  initialPage: number;
  onSelect: (target: JumpTarget) => void;
  onClose: () => void;
}

/** Type a page number (1–604) and open it. */
export const PageJumpSheet = ({
  open,
  initialPage,
  onSelect,
  onClose,
}: PageJumpSheetProps) => {
  const { t } = useTranslation("quran");

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
        <BottomSheet.Header title={t("navigation.pageJump")} />
        <BottomSheet.Body className="pb-6" keyboardShouldPersistTaps="handled">
          {/* Mounted per opening, so the field starts at the page in view. */}
          {open ? (
            <PageJumpForm initialPage={initialPage} onSelect={onSelect} />
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
