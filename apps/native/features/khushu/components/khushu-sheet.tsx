import "../i18n";
import {
  DEFAULT_KHUSHU_LEVEL,
  DISTRACTIONS,
  MAX_CUSTOM_DISTRACTION_LENGTH,
  MAX_KHUSHU_LEVEL,
  MIN_KHUSHU_LEVEL,
} from "@alrisali/domain/khushu";
import type { Distraction, Khushu } from "@alrisali/domain/khushu";
import { BottomSheet, Button, Chip, Input, Slider, Text } from "panelui-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";

import {
  useKhushuEntries,
  useRemoveKhushu,
  useSaveKhushu,
} from "../data/khushu";
import { useKhushuSheet } from "../hooks/use-khushu-sheet";
import type { KhushuTarget } from "../hooks/use-khushu-sheet";
import { listenForUnloggedSalah } from "../utils/unlogged-salah";

interface KhushuFormProps {
  target: KhushuTarget;
  /** The Salah's Khushu as saved, or undefined if it is not rated yet. */
  saved: Khushu | undefined;
  onDone: () => void;
}

const KhushuForm = ({ target, saved, onDone }: KhushuFormProps) => {
  const { t } = useTranslation("khushu");
  const [level, setLevel] = useState(saved?.level ?? DEFAULT_KHUSHU_LEVEL);
  const [distractions, setDistractions] = useState<readonly Distraction[]>(
    saved?.distractions ?? []
  );
  const [customDistraction, setCustomDistraction] = useState(
    saved?.customDistraction ?? ""
  );
  const save = useSaveKhushu();
  const remove = useRemoveKhushu();
  const salah = t(`salah.${target.salah}`);

  const toggle = (distraction: Distraction) =>
    setDistractions((picked) =>
      picked.includes(distraction)
        ? picked.filter((other) => other !== distraction)
        : [...picked, distraction]
    );

  const confirmRemove = () =>
    Alert.alert(
      t("confirmRemove.title", { salah }),
      t("confirmRemove.message"),
      [
        { text: t("confirmRemove.cancel"), style: "cancel" },
        {
          text: t("confirmRemove.confirm"),
          style: "destructive",
          onPress: () => remove.mutate(target, { onSuccess: onDone }),
        },
      ]
    );

  return (
    <>
      <BottomSheet.Header
        title={t("title", { salah })}
        description={t("description")}
      />
      <BottomSheet.Body>
        <View className="gap-6 pb-4">
          <View className="gap-2">
            <Slider
              label={t("level")}
              showValue
              formatValue={(value) => `${value}/${MAX_KHUSHU_LEVEL}`}
              min={MIN_KHUSHU_LEVEL}
              max={MAX_KHUSHU_LEVEL}
              step={1}
              value={level}
              onValueChange={setLevel}
              haptics
            />
            <View className="flex-row justify-between">
              <Text size="xs" muted>
                {t("distracted")}
              </Text>
              <Text size="xs" muted>
                {t("focused")}
              </Text>
            </View>
          </View>
          <View className="gap-3">
            <Text weight="medium">{t("distractions")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {DISTRACTIONS.map((distraction) => (
                <Chip
                  key={distraction}
                  selected={distractions.includes(distraction)}
                  haptics
                  onPress={() => toggle(distraction)}
                >
                  {t(`distraction.${distraction}`)}
                </Chip>
              ))}
            </View>
            <Input
              label={t("customDistraction")}
              placeholder={t("customDistractionPlaceholder")}
              value={customDistraction}
              onChangeText={setCustomDistraction}
              maxLength={MAX_CUSTOM_DISTRACTION_LENGTH}
              autoComplete="off"
            />
          </View>
          {save.isError || remove.isError ? (
            <Text className="text-destructive">{t("saveError")}</Text>
          ) : null}
        </View>
      </BottomSheet.Body>
      <BottomSheet.Footer className="gap-2">
        <Button
          loading={save.isPending}
          disabled={remove.isPending}
          onPress={() =>
            save.mutate(
              { ...target, level, distractions, customDistraction },
              { onSuccess: onDone }
            )
          }
        >
          {t("save")}
        </Button>
        {saved ? (
          <Button
            variant="ghost"
            loading={remove.isPending}
            disabled={save.isPending}
            onPress={confirmRemove}
          >
            {t("remove")}
          </Button>
        ) : null}
      </BottomSheet.Footer>
    </>
  );
};

/**
 * The Khushu sheet: opens after the Believer ticks a Salah (`SalahLogged`)
 * or presses a Khushu button, to rate, edit or remove that Salah's Khushu.
 * Un-ticking a Salah (`SalahUnlogged`) removes its Khushu. Mount it once.
 */
export const KhushuSheet = () => {
  const { target, open, close } = useKhushuSheet();
  const { data: entries } = useKhushuEntries();
  const { mutate: removeKhushu } = useRemoveKhushu();

  useEffect(
    () =>
      events.on("SalahLogged", ({ date, salah }) =>
        open({ date: Temporal.PlainDate.from(date), salah })
      ),
    [open]
  );

  useEffect(() => listenForUnloggedSalah(events, removeKhushu), [removeKhushu]);

  const saved =
    target &&
    entries?.find(
      (entry) => entry.date.equals(target.date) && entry.salah === target.salah
    );

  return (
    <BottomSheet
      open={target !== null && entries !== undefined}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          close();
        }
      }}
    >
      <BottomSheet.Content>
        {target && entries ? (
          <KhushuForm
            key={`${target.date.toString()}:${target.salah}`}
            target={target}
            saved={saved ?? undefined}
            onDone={close}
          />
        ) : null}
      </BottomSheet.Content>
    </BottomSheet>
  );
};
