import { ADHAN_STREAMS } from "@alrisali/domain/reminders";
import { Button, Card, Item, RadioGroup, Switch, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useAdhanServiceSettings } from "../hooks/use-adhan-service-settings";

/**
 * Android only: how the full adhan plays (the sound channel, Do Not Disturb,
 * the full-screen opt-in). Renders nothing where there is no adhan service.
 */
export const AdhanServiceCard = () => {
  const { t } = useTranslation("reminders");
  const { settings, fullScreenAllowed, update, openFullScreenSettings } =
    useAdhanServiceSettings();
  if (!settings) {
    return null;
  }
  const streamLabel = {
    alarm: t("adhanService.streamAlarm"),
    media: t("adhanService.streamMedia"),
  } as const;
  const streamHint = {
    alarm: t("adhanService.streamAlarmHint"),
    media: t("adhanService.streamMediaHint"),
  } as const;

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("adhanService.title")}</Card.Title>
        <Card.Description>{t("adhanService.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        <Text weight="medium">{t("adhanService.stream")}</Text>
        <RadioGroup
          value={settings.stream}
          onValueChange={(stream) => {
            if (stream === "alarm" || stream === "media") {
              update({ stream });
            }
          }}
        >
          {ADHAN_STREAMS.map((stream) => (
            <RadioGroup.Item
              key={stream}
              value={stream}
              label={streamLabel[stream]}
              description={streamHint[stream]}
            />
          ))}
        </RadioGroup>
        <Item size="sm">
          <Item.Content>
            <Item.Title>{t("adhanService.playDuringDnd")}</Item.Title>
            <Item.Description>
              {t("adhanService.playDuringDndHint")}
            </Item.Description>
          </Item.Content>
          <Item.Actions>
            <Switch
              label={t("adhanService.playDuringDnd")}
              value={settings.playDuringDnd}
              onValueChange={(playDuringDnd) => update({ playDuringDnd })}
            />
          </Item.Actions>
        </Item>
        <Item size="sm">
          <Item.Content>
            <Item.Title>{t("adhanService.fullScreen")}</Item.Title>
            <Item.Description>
              {t("adhanService.fullScreenHint")}
            </Item.Description>
          </Item.Content>
          <Item.Actions>
            <Switch
              label={t("adhanService.fullScreen")}
              value={settings.fullScreen}
              onValueChange={(fullScreen) => update({ fullScreen })}
            />
          </Item.Actions>
        </Item>
        {settings.fullScreen && !fullScreenAllowed ? (
          <>
            <Text muted>{t("adhanService.fullScreenDenied")}</Text>
            <Button onPress={openFullScreenSettings}>
              {t("adhanService.openFullScreenSettings")}
            </Button>
          </>
        ) : null}
      </Card.Content>
    </Card>
  );
};
