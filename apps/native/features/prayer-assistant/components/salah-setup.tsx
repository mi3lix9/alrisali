import {
  BOW_SENSITIVITY_LIMITS,
  CUSTOM_PACE_LIMITS,
  PACES,
  RECOGNITION_MODES,
} from "@alrisali/domain/prayer-assistant";
import type {
  PrayerAssistantSettings,
  SalahDefinition,
} from "@alrisali/domain/prayer-assistant";
import { Button, Card, RadioGroup, Slider, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { hasProximitySensor } from "../data/proximity-module";
import { SalahPicker } from "./salah-picker";

const HOLD_STEP_MS = 100;
const MS_PER_SECOND = 1000;

interface SalahSetupProps {
  settings: PrayerAssistantSettings;
  onChange: (change: Partial<PrayerAssistantSettings>) => void;
  onStart: (definition: SalahDefinition) => void;
}

/**
 * Choose the Salah, the Recognition Mode, the Pace and the bow sensitivity,
 * then start.
 */
export const SalahSetup = ({
  settings,
  onChange,
  onStart,
}: SalahSetupProps) => {
  const { t } = useTranslation("prayer-assistant");
  const [definition, setDefinition] = useState<SalahDefinition | null>(null);
  // Proximity needs the device's sensor; the other modes need nothing here.
  const offeredModes = RECOGNITION_MODES.filter(
    (mode) => mode !== "proximity" || hasProximitySensor()
  );
  const seconds = (ms: number) =>
    t("setup.seconds", { value: ms / MS_PER_SECOND });

  return (
    <>
      <SalahPicker onChange={setDefinition} />
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.recognitionMode")}</Card.Title>
          <Card.Description>
            {t("setup.recognitionModeDescription")}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <RadioGroup
            value={settings.recognitionMode}
            onValueChange={(value) => {
              const recognitionMode = RECOGNITION_MODES.find(
                (candidate) => candidate === value
              );
              if (recognitionMode) {
                onChange({ recognitionMode });
              }
            }}
          >
            {offeredModes.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                label={t(`mode.${option}`)}
              />
            ))}
          </RadioGroup>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.pace")}</Card.Title>
          <Card.Description>{t("setup.paceDescription")}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <RadioGroup
            value={settings.pace}
            onValueChange={(value) => {
              const pace = PACES.find((candidate) => candidate === value);
              if (pace) {
                onChange({ pace });
              }
            }}
          >
            {PACES.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                label={t(`pace.${option}`)}
              />
            ))}
          </RadioGroup>
          {settings.pace === "custom" ? (
            <View className="gap-4">
              <Slider
                label={t("setup.customHold")}
                showValue
                formatValue={seconds}
                min={CUSTOM_PACE_LIMITS.holdMs.min}
                max={CUSTOM_PACE_LIMITS.holdMs.max}
                step={HOLD_STEP_MS}
                defaultValue={settings.custom.holdMs}
                onValueCommit={(holdMs) =>
                  onChange({ custom: { ...settings.custom, holdMs } })
                }
              />
              <Slider
                label={t("setup.customTashahhud")}
                showValue
                formatValue={seconds}
                min={CUSTOM_PACE_LIMITS.tashahhudMs.min}
                max={CUSTOM_PACE_LIMITS.tashahhudMs.max}
                step={HOLD_STEP_MS}
                defaultValue={settings.custom.tashahhudMs}
                onValueCommit={(tashahhudMs) =>
                  onChange({ custom: { ...settings.custom, tashahhudMs } })
                }
              />
            </View>
          ) : null}
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.bowSensitivity")}</Card.Title>
          <Card.Description>
            {t("setup.bowSensitivityDescription")}
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-2">
          <Slider
            label={t("setup.bowSensitivity")}
            showValue
            formatValue={(value) => formatNumber(value)}
            min={BOW_SENSITIVITY_LIMITS.min}
            max={BOW_SENSITIVITY_LIMITS.max}
            step={1}
            defaultValue={settings.bowSensitivity}
            onValueCommit={(bowSensitivity) => onChange({ bowSensitivity })}
          />
          <View className="flex-row justify-between">
            <Text size="xs" muted>
              {t("setup.deeper")}
            </Text>
            <Text size="xs" muted>
              {t("setup.shallower")}
            </Text>
          </View>
        </Card.Content>
      </Card>
      <Button
        size="lg"
        disabled={definition === null}
        onPress={() => {
          if (definition) {
            onStart(definition);
          }
        }}
      >
        {t("setup.start")}
      </Button>
    </>
  );
};
