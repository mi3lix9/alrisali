import { DIGITS } from "@alrisali/domain/shared";
import { Card, RadioGroup } from "panelui-native";
import { useTranslation } from "react-i18next";

import { usePreferences } from "@/shared/lib/preferences";

/** Arabic-Indic or Western digits for the Arabic interface. */
export const DigitsCard = () => {
  const { t } = useTranslation("settings");
  const digits = usePreferences((state) => state.digits);
  const setDigits = usePreferences((state) => state.setDigits);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("digits.title")}</Card.Title>
        <Card.Description>{t("digits.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <RadioGroup
          value={digits}
          onValueChange={(value) => {
            const next = DIGITS.find((candidate) => candidate === value);
            if (next) {
              setDigits(next);
            }
          }}
        >
          {DIGITS.map((option) => (
            <RadioGroup.Item
              key={option}
              value={option}
              label={t(`digits.${option}`)}
            />
          ))}
        </RadioGroup>
      </Card.Content>
    </Card>
  );
};
