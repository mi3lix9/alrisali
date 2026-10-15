import "../i18n";
import { router, Stack } from "expo-router";
import { Button, Card, Spinner } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { QiblaCard } from "../components/qibla-card";

/** The Qibla compass for the Believer's location. */
export const QiblaScreen = () => {
  const { t } = useTranslation("qibla");
  const { data: believer } = useBelieverSettings();

  let body = <Spinner />;
  if (believer?.location) {
    body = <QiblaCard location={believer.location} />;
  } else if (believer) {
    // The location is set where Prayer Times use it, in the Prayer tab.
    body = (
      <Card>
        <Card.Header>
          <Card.Title>{t("noLocation.title")}</Card.Title>
          <Card.Description>{t("noLocation.description")}</Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button onPress={() => router.navigate("/prayer")}>
            {t("noLocation.action")}
          </Button>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("title") }} />
      {body}
    </Screen>
  );
};
