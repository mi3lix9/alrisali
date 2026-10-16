import "../i18n";
import { MIDNIGHT_DEFINITIONS } from "@alrisali/domain/shared";
import { Card, RadioGroup } from "panelui-native";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";

/** How Midnight is defined: the night that is halved. */
export const MidnightDefinitionCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();
  const { mutate: update } = useUpdateBelieverSettings();

  return (
    <Card testID="prayer-settings-midnight">
      <Card.Header>
        <Card.Title>{t("midnightDefinition.title")}</Card.Title>
        <Card.Description>
          {t("midnightDefinition.description")}
        </Card.Description>
      </Card.Header>
      {settings ? (
        <Card.Content>
          <RadioGroup
            accessibilityLabel={t("midnightDefinition.title")}
            value={settings.midnightDefinition}
            onValueChange={(value) => {
              const next = MIDNIGHT_DEFINITIONS.find(
                (definition) => definition === value
              );
              if (next) {
                update({ midnightDefinition: next });
              }
            }}
          >
            {MIDNIGHT_DEFINITIONS.map((definition) => (
              <RadioGroup.Item
                key={definition}
                value={definition}
                label={t(`midnightDefinition.${definition}`)}
              />
            ))}
          </RadioGroup>
        </Card.Content>
      ) : null}
    </Card>
  );
};
