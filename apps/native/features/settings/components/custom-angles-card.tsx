import "../i18n";
import {
  CUSTOM_ANGLE_RANGES,
  customAnglesSchema,
  readNumber,
} from "@alrisali/domain/shared";
import type { CustomAngles } from "@alrisali/domain/shared";
import { Button, Card, Input, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";
import { localizeDigits } from "@/shared/lib/numbers";

const FIELDS = ["fajr", "maghrib", "isha"] as const;

const CustomAnglesForm = ({ saved }: { saved: CustomAngles }) => {
  const { t } = useTranslation("settings");
  const { mutate: update, isPending } = useUpdateBelieverSettings();
  // Shown in the interface's digits; readNumber reads either.
  const [values, setValues] = useState(
    Object.fromEntries(
      FIELDS.map((field) => [field, localizeDigits(String(saved[field]))])
    ) as Record<(typeof FIELDS)[number], string>
  );
  const [invalid, setInvalid] = useState(false);

  const save = () => {
    const angles = customAnglesSchema.safeParse({
      fajr: readNumber(values.fajr),
      maghrib: readNumber(values.maghrib),
      isha: readNumber(values.isha),
    });
    setInvalid(!angles.success);
    if (angles.success) {
      update({ customAngles: angles.data });
    }
  };

  return (
    <>
      <Card.Content className="gap-3">
        {FIELDS.map((field) => (
          <Input
            key={field}
            label={t(`customAngles.${field}`, {
              min: CUSTOM_ANGLE_RANGES[field].min,
              max: CUSTOM_ANGLE_RANGES[field].max,
            })}
            value={values[field]}
            onChangeText={(text) =>
              setValues((current) => ({ ...current, [field]: text }))
            }
            keyboardType="numbers-and-punctuation"
          />
        ))}
        {invalid ? <Text muted>{t("customAngles.invalid")}</Text> : null}
      </Card.Content>
      <Card.Footer>
        <Button onPress={save} disabled={isPending}>
          {t("customAngles.save")}
        </Button>
      </Card.Footer>
    </>
  );
};

/**
 * The Advanced angles of the Custom Calculation Method: Fajr, Maghrib and Isha,
 * in degrees below the horizon, validated to sensible ranges.
 */
export const CustomAnglesCard = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("customAngles.title")}</Card.Title>
        <Card.Description>
          {settings?.calculationMethod === "custom"
            ? t("customAngles.descriptionActive")
            : t("customAngles.description")}
        </Card.Description>
      </Card.Header>
      {settings ? (
        <CustomAnglesForm
          // Reloads the fields when the saved angles change elsewhere.
          key={JSON.stringify(settings.customAngles)}
          saved={settings.customAngles}
        />
      ) : null}
    </Card>
  );
};
