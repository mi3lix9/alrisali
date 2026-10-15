import type { QuranReaderSettings } from "@alrisali/domain/quran";
import { BottomSheet } from "panelui-native";
import { useTranslation } from "react-i18next";

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
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
