import "../i18n";
import { THEME_PREFERENCES } from "@alrisali/domain/shared";
import { LANGUAGES } from "@alrisali/i18n";
import { reloadAppAsync } from "expo";
import { Button, Card, RadioGroup } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { launchLanguage, usePreferences } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { AboutCard } from "../components/about-card";
import { CalculationMethodCard } from "../components/calculation-method-card";
import { HijriAdjustmentCard } from "../components/hijri-adjustment-card";
import { LocationCard } from "../components/location-card";
import { MessageStyleCard } from "../components/message-style-card";
import { RemindersCard } from "../components/reminders-card";
import { TabsCard } from "../components/tabs-card";
import { TextSizeCard } from "../components/text-size-card";

interface SettingsScreenProps {
  /** Other features' settings cards, composed by the route. */
  featureCards?: ReactNode;
}

export const SettingsScreen = ({ featureCards }: SettingsScreenProps) => {
  const { t } = useTranslation("settings");
  const { language, theme, setLanguage, setTheme } = usePreferences();

  return (
    <Screen>
      <Card>
        <Card.Header>
          <Card.Title>{t("language.title")}</Card.Title>
          <Card.Description>{t("language.description")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <RadioGroup
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
        </Card.Content>
        {language === launchLanguage ? null : (
          <Card.Footer>
            <Button onPress={() => reloadAppAsync()}>
              {t("language.restartNow")}
            </Button>
          </Card.Footer>
        )}
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{t("theme.title")}</Card.Title>
        </Card.Header>
        <Card.Content>
          <RadioGroup
            value={theme}
            onValueChange={(value) => {
              const next = THEME_PREFERENCES.find(
                (candidate) => candidate === value
              );
              if (next) {
                setTheme(next);
              }
            }}
          >
            {THEME_PREFERENCES.map((option) => (
              <RadioGroup.Item
                key={option}
                value={option}
                label={t(`theme.${option}`)}
              />
            ))}
          </RadioGroup>
        </Card.Content>
      </Card>
      <LocationCard />
      <CalculationMethodCard />
      <HijriAdjustmentCard />
      <RemindersCard />
      <MessageStyleCard />
      <TextSizeCard />
      {featureCards}
      <TabsCard />
      <AboutCard />
    </Screen>
  );
};
