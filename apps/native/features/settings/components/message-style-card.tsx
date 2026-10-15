import { MESSAGE_STYLES } from "@alrisali/domain/shared";
import { Card, RadioGroup } from "panelui-native";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";

/** Classic (scriptural sources) or Modern (gentle coaching). */
export const MessageStyleCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();
  const { mutate: update } = useUpdateBelieverSettings();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("messageStyle.title")}</Card.Title>
        <Card.Description>{t("messageStyle.description")}</Card.Description>
      </Card.Header>
      {settings ? (
        <Card.Content>
          <RadioGroup
            accessibilityLabel={t("messageStyle.title")}
            value={settings.messageStyle}
            onValueChange={(value) => {
              const messageStyle = MESSAGE_STYLES.find(
                (style) => style === value
              );
              if (messageStyle) {
                update({ messageStyle });
              }
            }}
          >
            {MESSAGE_STYLES.map((style) => (
              <RadioGroup.Item
                key={style}
                value={style}
                label={t(`messageStyle.${style}`)}
                description={t(`messageStyle.${style}Hint`)}
              />
            ))}
          </RadioGroup>
        </Card.Content>
      ) : null}
    </Card>
  );
};
