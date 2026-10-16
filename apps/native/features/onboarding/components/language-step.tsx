import { LANGUAGES } from "@alrisali/i18n";
import { RadioGroup, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { launchLanguage, usePreferences } from "@/shared/lib/preferences";

/** The app's language, stored at once; Continue relaunches in it. */
export const LanguageStep = () => {
  const { t } = useTranslation("onboarding");
  const { language, setLanguage } = usePreferences();

  return (
    <>
      <RadioGroup
        accessibilityLabel={t("language.title")}
        value={language}
        onValueChange={(value) => {
          const next = LANGUAGES.find((candidate) => candidate === value);
          if (next) {
            setLanguage(next);
          }
        }}
      >
        {LANGUAGES.map((option) => (
          <RadioGroup.Item
            key={option}
            value={option}
            label={t(`language.${option}`)}
          />
        ))}
      </RadioGroup>
      {language === launchLanguage ? null : (
        <Text size="sm" muted>
          {t("language.restart")}
        </Text>
      )}
    </>
  );
};
