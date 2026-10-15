import {
  MAX_IMSAK_MINUTES,
  PRAYER_TIMES,
  TIME_FORMATS,
} from "@alrisali/domain/shared";
import type { PrayerTimeName, TimeFormat } from "@alrisali/domain/shared";
import {
  Card,
  Item,
  NumberInput,
  RadioGroup,
  Switch,
  Text,
} from "panelui-native";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateBelieverSettings } from "@/shared/lib/believer-settings";

import { useSetPrayerTimeVisible } from "../data/hidden-prayer-times";

const FORMAT_LABEL = {
  "12h": "options.hours12",
  "24h": "options.hours24",
} as const;

/** Time format, Imsak minutes and which Prayer Times are shown. */
export const OptionsCard = ({
  timeFormat,
  imsakMinutes,
  hidden,
}: {
  timeFormat: TimeFormat;
  imsakMinutes: number;
  hidden: readonly PrayerTimeName[];
}) => {
  const { t } = useTranslation("prayer-times");
  const { mutate: update } = useUpdateBelieverSettings();
  const { mutate: setVisible } = useSetPrayerTimeVisible();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("options.title")}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        <Text weight="medium">{t("options.timeFormat")}</Text>
        <RadioGroup
          accessibilityLabel={t("options.timeFormat")}
          value={timeFormat}
          onValueChange={(value) => {
            const next = TIME_FORMATS.find((format) => format === value);
            if (next) {
              update({ timeFormat: next });
            }
          }}
        >
          {TIME_FORMATS.map((format) => (
            <RadioGroup.Item
              key={format}
              value={format}
              label={t(FORMAT_LABEL[format])}
            />
          ))}
        </RadioGroup>
        <NumberInput
          label={t("options.imsakMinutes")}
          value={imsakMinutes}
          min={0}
          max={MAX_IMSAK_MINUTES}
          step={1}
          onValueChange={(minutes) => {
            if (Number.isInteger(minutes) && minutes !== imsakMinutes) {
              update({ imsakMinutes: minutes });
            }
          }}
        />
        <Text weight="medium">{t("options.shown")}</Text>
        <Text size="sm" muted>
          {t("options.shownDescription")}
        </Text>
        <Item.Group>
          {PRAYER_TIMES.map((name, index) => {
            const label = t(`names.${name}`);
            return (
              <Fragment key={name}>
                {index > 0 && <Item.Separator />}
                <Item size="sm">
                  <Item.Content>
                    <Item.Title>{label}</Item.Title>
                  </Item.Content>
                  <Item.Actions>
                    <Switch
                      label={label}
                      value={!hidden.includes(name)}
                      onValueChange={(visible) => setVisible({ name, visible })}
                    />
                  </Item.Actions>
                </Item>
              </Fragment>
            );
          })}
        </Item.Group>
      </Card.Content>
    </Card>
  );
};
