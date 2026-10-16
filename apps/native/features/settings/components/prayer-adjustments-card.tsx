import "../i18n";
import {
  MAX_ADJUSTMENT_MINUTES,
  PRAYER_TIMES,
  readPrayerAdjustments,
} from "@alrisali/domain/shared";
import { Card, NumberInput } from "panelui-native";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";
import { formatNumber, parseNumber } from "@/shared/lib/numbers";

/** A stepper per Prayer Time for its minute adjustment, −30 to +30. */
export const PrayerAdjustmentsCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();
  const { mutate: update } = useUpdateBelieverSettings();

  return (
    <Card testID="prayer-settings-adjustments">
      <Card.Header>
        <Card.Title>{t("prayerAdjustments.title")}</Card.Title>
        <Card.Description>
          {t("prayerAdjustments.description")}
        </Card.Description>
      </Card.Header>
      {settings ? (
        <Card.Content className="gap-3">
          {PRAYER_TIMES.map((name) => {
            const minutes = settings.prayerAdjustments[name] ?? 0;
            return (
              <NumberInput
                key={name}
                label={t("prayerAdjustments.label", {
                  name: t(`prayerAdjustments.names.${name}`),
                })}
                value={minutes}
                // A new function each render, so a change of digits
                // re-renders the field.
                formatValue={(value) => formatNumber(value)}
                parseValue={parseNumber}
                min={-MAX_ADJUSTMENT_MINUTES}
                max={MAX_ADJUSTMENT_MINUTES}
                step={1}
                onValueChange={(next) => {
                  if (Number.isInteger(next) && next !== minutes) {
                    update({
                      prayerAdjustments: readPrayerAdjustments({
                        ...settings.prayerAdjustments,
                        [name]: next,
                      }),
                    });
                  }
                }}
              />
            );
          })}
        </Card.Content>
      ) : null}
    </Card>
  );
};
