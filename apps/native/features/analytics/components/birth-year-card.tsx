import "../i18n";
import { BIRTH_YEAR_MIN, parseBirthYear } from "@alrisali/domain/analytics";
import { Button, Card, Input } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { localizeDigits } from "@/shared/lib/numbers";

import { useBirthYear } from "../data/birth-year";

/** The optional birth year, for the Admins' age report. */
export const BirthYearCard = () => {
  const { t } = useTranslation("analytics");
  const { birthYear, setBirthYear } = useBirthYear();
  // Shown in the interface's digits; parseBirthYear reads either.
  const [text, setText] = useState(
    birthYear === null ? "" : localizeDigits(String(birthYear))
  );
  const [invalid, setInvalid] = useState(false);

  const save = () => {
    const year = parseBirthYear(text, new Date().getFullYear());
    setInvalid(year === null);
    if (year !== null) {
      setBirthYear(year);
    }
  };

  const clear = () => {
    setText("");
    setInvalid(false);
    setBirthYear(null);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("birthYear.title")}</Card.Title>
        <Card.Description>{t("birthYear.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Input
          label={t("birthYear.label", { example: 1990 })}
          value={text}
          onChangeText={setText}
          keyboardType="number-pad"
          maxLength={4}
          {...(invalid
            ? { errorMessage: t("birthYear.invalid", { min: BIRTH_YEAR_MIN }) }
            : {})}
        />
      </Card.Content>
      <Card.Footer className="flex-row gap-2">
        <Button onPress={save}>{t("birthYear.save")}</Button>
        {birthYear === null ? null : (
          <Button variant="outline" onPress={clear}>
            {t("birthYear.clear")}
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};
