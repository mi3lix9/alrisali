import { CALCULATION_METHODS } from "@alrisali/domain/shared";
import { Card, RadioGroup } from "panelui-native";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";

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
        <Card.Content>
          <RadioGroup
            value={settings.calculationMethod}
            onValueChange={(value) => {
              const next = CALCULATION_METHODS.find(
                (candidate) => candidate === value
              );
              if (next) {
                update({ calculationMethod: next });
              }
            }}
          >
            {CALCULATION_METHODS.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                label={t(`calculationMethod.${option}`)}
              />
            ))}
          </RadioGroup>
        </Card.Content>
      ) : null}
    </Card>
  );
};
