import type { BookmarkRibbon } from "@alrisali/domain/quran";
import { RIBBON_NAME_MAX } from "@alrisali/domain/quran";
import { BottomSheet, Button, Input } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useChangeRibbon } from "../data/ribbons";

const RenameForm = ({
  ribbon,
  onDone,
}: {
  ribbon: BookmarkRibbon;
  onDone: () => void;
}) => {
  const { t } = useTranslation("quran");
  const change = useChangeRibbon();
  const [text, setText] = useState(ribbon.name ?? "");
  const save = (name: string) => {
    change.mutate({ type: "rename", color: ribbon.color, name });
    onDone();
  };

  return (
    <View className="gap-4">
      <Input
        testID="quran-ribbon-name-input"
        label={t("ribbons.renameField")}
        value={text}
        onChangeText={setText}
        placeholder={t(`ribbons.names.${ribbon.color}`)}
        maxLength={RIBBON_NAME_MAX}
        returnKeyType="done"
        autoFocus
        onSubmitEditing={() => save(text)}
      />
      <Button testID="quran-ribbon-name-save" onPress={() => save(text)}>
        {t("ribbons.renameSave")}
      </Button>
      <Button variant="outline" onPress={() => save("")}>
        {t("ribbons.renameDefault")}
      </Button>
    </View>
  );
};

interface RibbonRenameSheetProps {
  /** The ribbon being renamed; null keeps the sheet closed. */
  ribbon: BookmarkRibbon | null;
  onClose: () => void;
}

/** Names a Bookmark Ribbon, or restores its colour's default name. */
export const RibbonRenameSheet = ({
  ribbon,
  onClose,
}: RibbonRenameSheetProps) => {
  const { t } = useTranslation("quran");

  return (
    <BottomSheet
      open={ribbon !== null}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header
          title={
            ribbon
              ? t("ribbons.renameTitle", {
                  color: t(`ribbons.names.${ribbon.color}`),
                })
              : ""
          }
        />
        <BottomSheet.Body className="pb-6" keyboardShouldPersistTaps="handled">
          {/* Mounted per opening, so the field starts at the current name. */}
          {ribbon ? <RenameForm ribbon={ribbon} onDone={onClose} /> : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
