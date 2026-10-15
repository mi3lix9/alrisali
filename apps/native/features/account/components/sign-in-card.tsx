import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from "expo-apple-authentication";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useUniwind } from "uniwind";

import "../i18n";
import { useSignIn } from "../hooks/use-sign-in";
import { appleIdToken, googleIdToken } from "../utils/native-sign-in";

const APPLE_BUTTON_STYLE = { height: 48, width: "100%" } as const;
const APPLE_BUTTON_RADIUS = 12;

/** A Guest's way in: Apple (iOS) and Google, each through its native sheet. */
export const SignInCard = () => {
  const { t } = useTranslation("account");
  const { theme } = useUniwind();
  const signIn = useSignIn();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("guest.title")}</Card.Title>
        <Card.Description>{t("guest.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        {Platform.OS === "ios" ? (
          <AppleAuthenticationButton
            buttonType={AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              theme === "dark"
                ? AppleAuthenticationButtonStyle.WHITE
                : AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={APPLE_BUTTON_RADIUS}
            style={APPLE_BUTTON_STYLE}
            onPress={() => signIn.mutate(appleIdToken)}
          />
        ) : null}
        <Button
          variant="social"
          testID="account-google-sign-in"
          loading={signIn.isPending}
          onPress={() => signIn.mutate(googleIdToken)}
        >
          {t("signIn.google")}
        </Button>
        {signIn.isError ? (
          <Text className="text-destructive">{t("signIn.failed")}</Text>
        ) : null}
      </Card.Content>
    </Card>
  );
};
