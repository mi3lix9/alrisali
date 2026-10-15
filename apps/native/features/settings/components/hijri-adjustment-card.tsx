import { Card, RadioGroup, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";
import {
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";

/** The Believer's own Hijri Adjustment, −2 to +2 days. */
const OPTIONS = [
  { days: -2, label: "minus2" },
  { days: -1, label: "minus1" },
  { days: 0, label: "none" },
  { days: 1, label: "plus1" },
  { days: 2, label: "plus2" },
] as const;

export const HijriAdjustmentCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();
  const { mutate: update } = useUpdateBelieverSettings();
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("hijriAdjustment.title")}</Card.Title>
        <Card.Description>{t("hijriAdjustment.description")}</Card.Description>
      </Card.Header>
      {settings ? (
        <Card.Content className="gap-4">
          <RadioGroup
            value={String(settings.hijriAdjustment)}
            onValueChange={(value) => {
              const next = OPTIONS.find(({ days }) => String(days) === value);
              if (next) {
                update({ hijriAdjustment: next.days });
              }
            }}
          >
            {OPTIONS.map(({ days, label }) => (
              <RadioGroup.Item
                key={days}
                value={String(days)}
                label={t(`hijriAdjustment.${label}`)}
              />
            ))}
          </RadioGroup>
          <Text muted>
            {t("hijriAdjustment.today", {
              date: formatHijriDate(
                calendar.toHijri(Temporal.Now.plainDateISO())
              ),
            })}
          </Text>
        </Card.Content>
      ) : null}
    </Card>
  );
};
