import "../i18n";
import { Alert, Badge, Button, Card, Item, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Screen } from "@/shared/ui/screen";

import { useAlertHealth } from "../hooks/use-alert-health";
import { sendTestAlert } from "../utils/send-test-alert";

type TestState = "idle" | "sent" | "denied";

/**
 * Whether alerts can arrive: each check with its state and a fix that opens
 * the right system screen, and a test alert to confirm the fix worked.
 */
export const AlertHealthScreen = () => {
  const { t } = useTranslation("reminders");
  const { checks, maker, fixes, confirmAutostart } = useAlertHealth();
  const [test, setTest] = useState<TestState>("idle");
  const failing = checks.filter((check) => check.status === "failing");

  return (
    <Screen>
      <Text muted>{t("health.description")}</Text>
      {checks.length > 0 ? (
        <Alert
          variant={failing.length === 0 ? "success" : "warning"}
          testID="alert-health-summary"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              {failing.length === 0
                ? t("health.allGood")
                : t("health.needsAttention")}
            </Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      {checks.map(({ id, status }) => (
        <Card key={id} testID={`alert-check-${id}`}>
          <Card.Content className="gap-3 pt-6">
            <Item size="sm">
              <Item.Content>
                <Item.Title>{t(`health.checks.${id}.title`)}</Item.Title>
                <Item.Description>
                  {status === "ok"
                    ? t(`health.checks.${id}.ok`)
                    : t(`health.checks.${id}.failing`, { maker })}
                </Item.Description>
              </Item.Content>
              <Item.Actions>
                <Badge
                  size="sm"
                  variant={status === "ok" ? "outline" : "destructive"}
                >
                  {t(`health.status.${status}`)}
                </Badge>
              </Item.Actions>
            </Item>
            {status === "failing" ? (
              <Button testID={`alert-fix-${id}`} onPress={() => fixes[id]()}>
                {t(`health.checks.${id}.fix`)}
              </Button>
            ) : null}
            {id === "autostart" ? (
              <Button
                variant="outline"
                testID="alert-autostart-toggle"
                onPress={() => confirmAutostart(status === "failing")}
              >
                {status === "failing"
                  ? t("health.checks.autostart.confirm")
                  : t("health.checks.autostart.undo")}
              </Button>
            ) : null}
          </Card.Content>
        </Card>
      ))}
      <Card>
        <Card.Content className="gap-3 pt-6">
          <Text muted>{t("health.test.hint")}</Text>
          <Button
            testID="alert-test-send"
            onPress={async () => {
              const sent = await sendTestAlert(
                t("health.test.title"),
                t("health.test.body")
              );
              setTest(sent ? "sent" : "denied");
            }}
          >
            {t("health.test.button")}
          </Button>
          {test === "idle" ? null : (
            <Text accessibilityLiveRegion="polite">
              {t(`health.test.${test}`)}
            </Text>
          )}
        </Card.Content>
      </Card>
    </Screen>
  );
};
