import { RECITERS } from "@alrisali/domain/quran";
import type { Reciter } from "@alrisali/domain/quran";
import { BottomSheet, Text } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

/** A reciter's name in the UI language. */
export const useReciterName = () => {
  const { i18n } = useTranslation("quran");
  return (reciter: Reciter) =>
    i18n.language === "ar" ? reciter.name.ar : reciter.name.en;
};

interface ReciterSheetProps {
  open: boolean;
  reciter: string;
  onSelect: (reciter: string) => void;
  onClose: () => void;
}

/** The reciters bundled with the app, the chosen one ticked. */
export const ReciterSheet = ({
  open,
  reciter: chosen,
  onSelect,
  onClose,
}: ReciterSheetProps) => {
  const { t } = useTranslation("quran");
  const nameOf = useReciterName();

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
        <BottomSheet.Header title={t("recitation.reciters")} />
        <BottomSheet.Body className="pb-6">
          <ScrollView style={{ maxHeight: 420 }}>
            {RECITERS.map((reciter) => {
              const selected = reciter.key === chosen;
              return (
                <Pressable
                  key={reciter.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(reciter.key)}
                  className="border-border flex-row items-center gap-3 border-b py-3"
                >
                  <View className="flex-1">
                    <Text weight={selected ? "semibold" : "normal"}>
                      {nameOf(reciter)}
                    </Text>
                    <Text size="xs" muted>
                      {t(`recitation.style.${reciter.style}`)}
                    </Text>
                  </View>
                  {selected ? <CheckIcon size={20} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
