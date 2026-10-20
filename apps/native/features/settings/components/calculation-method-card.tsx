import "../i18n";
import { CALCULATION_METHOD_GROUPS } from "@alrisali/domain/shared";
import type { CalculationMethod } from "@alrisali/domain/shared";
import { Card, RadioGroup, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";

/**
 * The Calculation Methods, grouped Shia, Sunni and other. Onboarding reuses
 * it through its route; Custom's angles are edited in Prayer settings.
 */
export const CalculationMethodCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();
  const { mutate: update } = useUpdateBelieverSettings();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("calculationMethod.title")}</Card.Title>
        <Card.Description>
          {t("calculationMethod.description")}
        </Card.Description>
      </Card.Header>
      {settings ? (
        <Card.Content className="gap-4">
          {CALCULATION_METHOD_GROUPS.map(({ group, methods }) => {
            const chosen = (methods as readonly CalculationMethod[]).find(
              (method) => method === settings.calculationMethod
            );
            return (
              <RadioGroup
                key={group}
                value={chosen ?? ""}
                onValueChange={(value) => {
                  const next = methods.find((candidate) => candidate === value);
                  if (next) {
                    update({ calculationMethod: next });
                  }
                }}
              >
                <Text muted>{t(`calculationMethod.groups.${group}`)}</Text>
                {methods.map((option) => (
                  <RadioGroup.Item
                    key={option}
                    value={option}
                    label={t(`calculationMethod.${option}`)}
                  />
                ))}
              </RadioGroup>
            );
          })}
        </Card.Content>
      ) : null}
    </Card>
  );
};
