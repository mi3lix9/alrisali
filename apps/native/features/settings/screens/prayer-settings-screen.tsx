import "../i18n";
import { Alert } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { CalculationMethodCard } from "../components/calculation-method-card";
import { CustomAnglesCard } from "../components/custom-angles-card";

/**
 * Prayer settings, one sub-route of the Settings modal that every Prayer
 * Times setting lives in: the Calculation Method and its Advanced angles.
 * Later settings (adjustments, Midnight, high latitudes) add cards here.
 */
export const PrayerSettingsScreen = () => {
  const { t } = useTranslation("settings");
  const { data: settings } = useBelieverSettings();

  return (
    <Screen>
      <CalculationMethodCard />
      {settings?.calculationMethod === "jafari" ? (
        <Alert variant="info">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t("prayerSettings.jafariIsha")}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <CustomAnglesCard />
    </Screen>
  );
};
