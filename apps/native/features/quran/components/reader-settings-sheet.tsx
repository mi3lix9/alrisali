import type { QuranReaderSettings } from "@alrisali/domain/quran";
import { router } from "expo-router";
import { BottomSheet, Button } from "panelui-native";
import { HeartIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import "../i18n/duas";
import { ReaderSettingsControls } from "./reader-settings-controls";

interface ReaderSettingsSheetProps {
  open: boolean;
  settings: QuranReaderSettings;
  onChange: (change: Partial<QuranReaderSettings>) => void;
  onClose: () => void;
}

export const ReaderSettingsSheet = ({
  open,
  settings,
  onChange,
  onClose,
}: ReaderSettingsSheetProps) => {
  const { t } = useTranslation("quran");
  const { t: tDuas } = useTranslation("quranDuas");
  const openDuas = (pathname: "/recitation-duas" | "/quranic-duas") => {
    onClose();
    router.push(pathname);
  };

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
        <BottomSheet.Header title={t("settings.title")} />
        <BottomSheet.Body className="pb-6">
          <ReaderSettingsControls settings={settings} onChange={onChange} />
          <View className="mt-4 gap-2">
            <Button
              testID="reader-recitation-duas"
              variant="outline"
              startContent={<HeartIcon size={18} />}
              onPress={() => openDuas("/recitation-duas")}
            >
              {tDuas("recitation.open")}
            </Button>
            <Button
              testID="reader-quranic-duas"
              variant="outline"
              startContent={<HeartIcon size={18} />}
              onPress={() => openDuas("/quranic-duas")}
            >
              {tDuas("title")}
            </Button>
          </View>
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
