import "../i18n";
import { availablePrograms, copyAct } from "@alrisali/domain/programs";
import type { Act } from "@alrisali/domain/programs";
import { randomUUID } from "expo-crypto";
import { BottomSheet, Button, Spinner, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useHijriToday } from "@/shared/lib/hijri-today";
import { joinParts } from "@/shared/lib/i18n";
import { launchLanguage } from "@/shared/lib/preferences";

import { useOfficialPrograms } from "../data/official-programs";
import { useDescribe } from "../hooks/use-describe";

/** The Official Programs available today, each Act with an Add button. */
const Picker = ({
  onAdd,
  onDone,
}: {
  onAdd: (act: Act) => void;
  onDone: () => void;
}) => {
  const { t } = useTranslation("programs");
  const describe = useDescribe();
  const today = useHijriToday();
  const programs = useOfficialPrograms();
  // The Acts added while the sheet is open, by their Official id.
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set());
  const available = availablePrograms(programs.data ?? [], today).filter(
    ({ acts }) => acts.length > 0
  );

  return (
    <>
      <BottomSheet.Header
        title={t("picker.title")}
        description={t("picker.description")}
      />
      <BottomSheet.Body>
        <View className="gap-6 pb-4">
          {programs.isPending ? <Spinner /> : null}
          {!programs.isPending && available.length === 0 ? (
            <Text muted>{t("picker.empty")}</Text>
          ) : null}
          {available.map((program) => (
            <View key={program.id} className="gap-3">
              <Text weight="semibold" accessibilityRole="header">
                {program.name[launchLanguage]}
              </Text>
              {program.acts.map((act) => {
                const key = `${program.id}:${act.id}`;
                const name = act.name[launchLanguage];
                return (
                  <View key={key} className="flex-row items-center gap-2">
                    <View className="flex-1 gap-1">
                      <Text>{name}</Text>
                      <Text muted size="sm">
                        {joinParts(
                          [
                            act.detail.type === "regular"
                              ? null
                              : t(`types.${act.detail.type}`),
                            describe.timing(act),
                            describe.schedule(act),
                          ].filter((part): part is string => part !== null)
                        )}
                      </Text>
                    </View>
                    <Button
                      variant={added.has(key) ? "secondary" : "outline"}
                      size="sm"
                      accessibilityLabel={t("picker.addLabel", { act: name })}
                      onPress={() => {
                        onAdd(copyAct(act, randomUUID()));
                        setAdded((previous) => new Set(previous).add(key));
                      }}
                    >
                      {added.has(key) ? t("picker.added") : t("picker.add")}
                    </Button>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </BottomSheet.Body>
      <BottomSheet.Footer>
        <Button onPress={onDone}>{t("picker.done")}</Button>
      </BottomSheet.Footer>
    </>
  );
};

/**
 * Picks Acts from the Official Programs into a Personal Program. Each is
 * copied under a new id, its dua or prayer included.
 */
export const OfficialActPickerSheet = ({
  open,
  onAdd,
  onClose,
}: {
  open: boolean;
  onAdd: (act: Act) => void;
  onClose: () => void;
}) => (
  <BottomSheet
    open={open}
    onOpenChange={(next) => {
      if (!next) {
        onClose();
      }
    }}
  >
    <BottomSheet.Content>
      {open ? <Picker onAdd={onAdd} onDone={onClose} /> : null}
    </BottomSheet.Content>
  </BottomSheet>
);
