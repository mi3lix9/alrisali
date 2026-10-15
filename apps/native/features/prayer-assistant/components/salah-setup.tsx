import {
  BOW_SENSITIVITY_LIMITS,
  CUSTOM_PACE_LIMITS,
  PACES,
  RAKAH_COUNT,
} from "@alrisali/domain/prayer-assistant";
import type { PrayerAssistantSettings } from "@alrisali/domain/prayer-assistant";
import { SALAH } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";
import { Button, Card, RadioGroup, Slider, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const HOLD_STEP_MS = 100;
const MS_PER_SECOND = 1000;

interface SalahSetupProps {
  settings: PrayerAssistantSettings;
  onChange: (change: Partial<PrayerAssistantSettings>) => void;
  onStart: (salah: Salah) => void;
}

/** Choose the Salah, the Pace and the bow sensitivity, then start. */
export const SalahSetup = ({
  settings,
  onChange,
  onStart,
}: SalahSetupProps) => {
  const { t } = useTranslation("prayer-assistant");
  const [salah, setSalah] = useState<Salah | null>(null);
  const seconds = (ms: number) =>
    t("setup.seconds", { value: ms / MS_PER_SECOND });

  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.salah")}</Card.Title>
        </Card.Header>
        <Card.Content>
          <RadioGroup
            value={salah ?? ""}
            onValueChange={(value) =>
              setSalah(SALAH.find((candidate) => candidate === value) ?? null)
            }
          >
            {SALAH.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                label={t("setup.salahRakahs", {
                  name: t(`salah.${option}`),
                  count: RAKAH_COUNT[option],
                })}
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
        disabled={salah === null}
        onPress={() => {
          if (salah) {
            onStart(salah);
          }
        }}
      >
        {t("setup.start")}
      </Button>
    </>
  );
};
