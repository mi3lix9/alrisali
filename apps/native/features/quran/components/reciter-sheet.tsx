import { groupReciters } from "@alrisali/domain/quran";
import type { AyahKey, Reciter } from "@alrisali/domain/quran";
import { BottomSheet, Text } from "panelui-native";
import { CheckIcon, PauseIcon, PlayIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

import {
  sendRecitation,
  useRecitationPlayback,
} from "../data/recitation-player";

const GROUPS = groupReciters();

/** A reciter's name in the UI language. */
export const useReciterName = () => {
  const { i18n } = useTranslation("quran");
  return (reciter: Reciter) =>
    i18n.language === "ar" ? reciter.name.ar : reciter.name.en;
};

interface ReciterSheetProps {
  open: boolean;
  reciter: string;
  /** The first ayah on the current page; a sample recites from here to the page's end. */
  start: AyahKey;
  onSelect: (reciter: string) => void;
  onClose: () => void;
}

/**
 * The reciters bundled with the app, by style then region, the chosen one
 * ticked. Each can be sampled on the current page without choosing it.
 */
export const ReciterSheet = ({
  open,
  reciter: chosen,
  start,
  onSelect,
  onClose,
}: ReciterSheetProps) => {
  const { t } = useTranslation("quran");
  const nameOf = useReciterName();
  const playback = useRecitationPlayback();

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
            {GROUPS.map(({ style, regions }) => (
              <View key={style} className="mb-2">
                <Text weight="semibold" className="pt-2">
                  {t(`recitation.style.${style}`)}
                </Text>
                {regions.map(({ region, reciters }) => (
                  <View key={region}>
                    <Text size="xs" muted className="pt-2">
                      {t(`recitation.region.${region}`)}
                    </Text>
                    {reciters.map((reciter) => {
                      const selected = reciter.key === chosen;
                      const sampling =
                        playback.status !== "idle" &&
                        playback.reciter === reciter.key &&
                        playback.plan.to.kind === "page";
                      return (
                        <View
                          key={reciter.key}
                          className="border-border flex-row items-center gap-3 border-b"
                        >
                          <Pressable
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() => onSelect(reciter.key)}
                            className="flex-1 flex-row items-center gap-3 py-3"
                          >
                            <Text
                              weight={selected ? "semibold" : "normal"}
                              className="flex-1"
                            >
                              {nameOf(reciter)}
                            </Text>
                            {selected ? <CheckIcon size={20} /> : null}
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t(
                              sampling
                                ? "recitation.stopSample"
                                : "recitation.sample",
                              { reciter: nameOf(reciter) }
                            )}
                            hitSlop={8}
                            onPress={() =>
                              sendRecitation(
                                sampling
                                  ? { type: "stop" }
                                  : {
                                      type: "play",
                                      ayah: start,
                                      reciter: reciter.key,
                                      to: { kind: "page" },
                                    }
                              )
                            }
                            className="p-2"
                          >
                            {sampling ? (
                              <PauseIcon size={20} />
                            ) : (
                              <PlayIcon size={20} />
                            )}
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
