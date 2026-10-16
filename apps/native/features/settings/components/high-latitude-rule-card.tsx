import "../i18n";
import { HIGH_LATITUDE_RULES } from "@alrisali/domain/shared";
import { Card, RadioGroup } from "panelui-native";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";

/** The Fajr and Isha rule for high latitudes. */
export const HighLatitudeRuleCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();
  const { mutate: update } = useUpdateBelieverSettings();

  return (
    <Card testID="prayer-settings-high-latitude">
      <Card.Header>
        <Card.Title>{t("highLatitudeRule.title")}</Card.Title>
        <Card.Description>{t("highLatitudeRule.description")}</Card.Description>
      </Card.Header>
      {settings ? (
        <Card.Content>
          <RadioGroup
            accessibilityLabel={t("highLatitudeRule.title")}
            value={settings.highLatitudeRule}
            onValueChange={(value) => {
              const next = HIGH_LATITUDE_RULES.find((rule) => rule === value);
              if (next) {
                update({ highLatitudeRule: next });
              }
            }}
          >
            {HIGH_LATITUDE_RULES.map((rule) => (
              <RadioGroup.Item
                key={rule}
                value={rule}
                label={t(`highLatitudeRule.${rule}`)}
              />
            ))}
          </RadioGroup>
        </Card.Content>
      ) : null}
    </Card>
  );
};
