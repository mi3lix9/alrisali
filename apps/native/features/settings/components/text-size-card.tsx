import { TEXT_SIZES } from "@alrisali/domain/shared";
import { Card, RadioGroup, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { usePreferences } from "@/shared/lib/preferences";

export const TextSizeCard = () => {
  const { t } = useTranslation("settings");
  const textSize = usePreferences((state) => state.textSize);
  const setTextSize = usePreferences((state) => state.setTextSize);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("textSize.title")}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        <RadioGroup
          value={textSize}
          onValueChange={(value) => {
            const next = TEXT_SIZES.find((candidate) => candidate === value);
            if (next) {
              setTextSize(next);
            }
          }}
        >
          {TEXT_SIZES.map((option) => (
            <RadioGroup.Item
              key={option}
              value={option}
              label={t(`textSize.${option}`)}
            />
          ))}
        </RadioGroup>
        <Text muted>{t("textSize.preview")}</Text>
      </Card.Content>
    </Card>
  );
};
