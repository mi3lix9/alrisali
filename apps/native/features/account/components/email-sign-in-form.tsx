import { useQuery } from "@tanstack/react-query";
import { Button, Input, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { orpc } from "@/shared/lib/orpc";

import "../i18n";
import { signInWithEmail } from "../hooks/use-sign-in";
import type { EmailCredentials, SignInAttempt } from "../hooks/use-sign-in";

/**
 * Email and password sign-in and sign-up for local development and test
 * accounts: shown in development builds, or when the server has it on.
 */
export const EmailSignInForm = ({
  onSubmit,
  isPending,
}: {
  onSubmit: (attempt: SignInAttempt) => void;
  isPending: boolean;
}) => {
  const { t } = useTranslation("account");
  const options = useQuery({
    ...orpc.account.signInOptions.queryOptions(),
    enabled: !__DEV__,
  });
  const [mode, setMode] = useState<EmailCredentials["mode"]>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!__DEV__ && !options.data?.emailPassword) {
    return null;
  }

  return (
    <View className="border-border gap-3 border-t pt-3">
      <Text muted>{t("emailSignIn.title")}</Text>
      {mode === "sign-up" ? (
        <Input
          testID="account-email-name"
          label={t("emailSignIn.name")}
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
        />
      ) : null}
      <Input
        testID="account-email-address"
        label={t("emailSignIn.email")}
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        testID="account-email-password"
        label={t("emailSignIn.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        textContentType={mode === "sign-up" ? "newPassword" : "password"}
      />
      <Button
        testID="account-email-submit"
        variant="outline"
        loading={isPending}
        onPress={() =>
          onSubmit(() => signInWithEmail({ mode, name, email, password }))
        }
      >
        {mode === "sign-up" ? t("emailSignIn.signUp") : t("emailSignIn.signIn")}
      </Button>
      <Button
        testID="account-email-switch-mode"
        variant="ghost"
        onPress={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}
      >
        {mode === "sign-up"
          ? t("emailSignIn.haveAccount")
          : t("emailSignIn.needAccount")}
      </Button>
    </View>
  );
};
