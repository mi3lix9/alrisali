import {
  CUSTOM_RAKAH_LIMITS,
  customSalah,
  SALAH_DEFINITIONS,
  SALAH_TYPES,
  withNafila,
} from "@alrisali/domain/prayer-assistant";
import type {
  SalahDefinition,
  SalahType,
} from "@alrisali/domain/prayer-assistant";
import { SALAH } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";
import {
  Card,
  Item,
  NumberInput,
  RadioGroup,
  Switch,
  Text,
} from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber, parseNumber } from "@/shared/lib/numbers";

type Choice = SalahType | "custom";

/** The prayers besides the five, then a Custom count. */
const OTHER_CHOICES: readonly Exclude<Choice, Salah>[] = [
  ...SALAH_TYPES.filter(
    (type): type is Exclude<SalahType, Salah> =>
      !SALAH.some((salah) => salah === type)
  ),
  "custom",
];

const DEFAULT_CUSTOM_RAKAHS = 2;

const definitionOf = (
  choice: Choice,
  nafila: boolean,
  rakahs: number
): SalahDefinition => {
  if (choice === "custom") {
    return customSalah(rakahs);
  }
  const salah = SALAH.find((candidate) => candidate === choice);
  return salah && nafila ? withNafila(salah) : SALAH_DEFINITIONS[choice];
};

const rakahsIn = ({ segments }: SalahDefinition) =>
  segments.reduce((sum, segment) => sum + segment.rakahs, 0);

interface SalahPickerProps {
  onChange: (definition: SalahDefinition) => void;
}

interface Picked {
  choice: Choice | null;
  /** With its nafila, when an obligatory Salah is chosen. */
  nafila: boolean;
  /** The Custom count, kept while another prayer is chosen. */
  rakahs: number;
}

/**
 * Choose the prayer: one of the five, with its nafila or without; another
 * prayer; or a Custom count of Rak'ahs. Shows what the assistant will count.
 */
export const SalahPicker = ({ onChange }: SalahPickerProps) => {
  const { t } = useTranslation("prayer-assistant");
  const [picked, setPicked] = useState<Picked>({
    choice: null,
    nafila: false,
    rakahs: DEFAULT_CUSTOM_RAKAHS,
  });
  const { choice, nafila, rakahs } = picked;
  const definition = choice ? definitionOf(choice, nafila, rakahs) : null;

  const choose = (change: Partial<Picked>) => {
    const next = { ...picked, ...change };
    setPicked(next);
    if (next.choice) {
      onChange(definitionOf(next.choice, next.nafila, next.rakahs));
    }
  };
  const pick = (value: string) => {
    const found = [...SALAH_TYPES, "custom" as const].find(
      (candidate) => candidate === value
    );
    if (found) {
      choose({ choice: found });
    }
  };
  const obligatory = SALAH.some((salah) => salah === choice);

  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.salah")}</Card.Title>
        </Card.Header>
        <Card.Content className="gap-2">
          <RadioGroup value={choice ?? ""} onValueChange={pick}>
            {SALAH.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                label={t("setup.salahRakahs", {
                  name: t(`salah.${option}`),
                  count: rakahsIn(SALAH_DEFINITIONS[option]),
                })}
              />
            ))}
          </RadioGroup>
          {obligatory ? (
            <Item>
              <Item.Content>
                <Item.Title>{t("setup.nafila")}</Item.Title>
                <Item.Description>
                  {t("setup.nafilaDescription")}
                </Item.Description>
              </Item.Content>
              <Item.Actions>
                <Switch
                  label={t("setup.nafila")}
                  value={nafila}
                  onValueChange={(on) => choose({ nafila: on })}
                />
              </Item.Actions>
            </Item>
          ) : null}
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.otherPrayers")}</Card.Title>
        </Card.Header>
        <Card.Content className="gap-2">
          <RadioGroup value={choice ?? ""} onValueChange={pick}>
            {OTHER_CHOICES.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                label={t(`salah.${option}`)}
                description={t(`about.${option}`)}
              />
            ))}
          </RadioGroup>
          {choice === "custom" ? (
            <NumberInput
              label={t("setup.customRakahs")}
              value={rakahs}
              formatValue={(value) => formatNumber(value)}
              parseValue={parseNumber}
              min={CUSTOM_RAKAH_LIMITS.min}
              max={CUSTOM_RAKAH_LIMITS.max}
              step={1}
              onValueChange={(value) => choose({ rakahs: value })}
            />
          ) : null}
        </Card.Content>
      </Card>
      {definition ? (
        <Text muted className="px-2">
          {definition.segments.length > 1
            ? t("setup.summaryPrayers", {
                rakahs: t("setup.rakahs", { count: rakahsIn(definition) }),
                count: definition.segments.length,
              })
            : t("setup.rakahs", { count: rakahsIn(definition) })}
        </Text>
      ) : null}
    </>
  );
};
