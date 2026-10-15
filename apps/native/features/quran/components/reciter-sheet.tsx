import type { Reciter } from "@alrisali/api/quran";
import { BottomSheet, Button, Spinner, Text } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

import { useReciters } from "../data/reciters";

const STYLE_KEYS: Record<
  string,
  `recitation.style.${"Murattal" | "Mujawwad" | "Muallim"}`
> = {
  Murattal: "recitation.style.Murattal",
  Mujawwad: "recitation.style.Mujawwad",
  Muallim: "recitation.style.Muallim",
};

/** A reciter's name in the UI language. */
export const useReciterName = () => {
  const { i18n } = useTranslation("quran");
  return (reciter: Reciter) =>
    i18n.language === "ar" ? reciter.name.ar : reciter.name.en;
};

interface ReciterSheetProps {
  open: boolean;
  reciterId: number;
  onSelect: (reciterId: number) => void;
  onClose: () => void;
}

/** The Quran Foundation reciters, the chosen one ticked. */
export const ReciterSheet = ({
  open,
  reciterId,
  onSelect,
  onClose,
}: ReciterSheetProps) => {
  const { t } = useTranslation("quran");
  const reciters = useReciters();
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
          {reciters.isPending ? (
            <View className="items-center py-6">
              <Spinner />
            </View>
          ) : null}
          {reciters.isError ? (
            <View className="items-start gap-3 py-2">
              <Text muted>{t("recitation.recitersFailed")}</Text>
              <Button variant="outline" onPress={() => reciters.refetch()}>
                {t("recitation.retry")}
              </Button>
            </View>
          ) : null}
          <ScrollView style={{ maxHeight: 420 }}>
            {reciters.data?.map((reciter) => {
              const selected = reciter.id === reciterId;
              const styleKey = reciter.style
                ? STYLE_KEYS[reciter.style]
                : undefined;
              const style = styleKey ? t(styleKey) : reciter.style;
              return (
                <Pressable
                  key={reciter.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(reciter.id)}
                  className="border-border flex-row items-center gap-3 border-b py-3"
                >
                  <View className="flex-1">
                    <Text weight={selected ? "semibold" : "normal"}>
                      {nameOf(reciter)}
                    </Text>
                    {style ? (
                      <Text size="xs" muted>
                        {style}
                      </Text>
                    ) : null}
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
