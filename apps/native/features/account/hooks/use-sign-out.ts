import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { authClient } from "@/shared/lib/auth-client";
import { events } from "@/shared/lib/events";

import "../i18n";
import { forgetGoogleAccount } from "../utils/native-sign-in";

/**
 * Signs the Believer out after they confirm that this device's data goes
 * with them. The auth client drops the SecureStore session before it calls
 * the server, so signing out works offline too. `SignedOut` tells the device
 * database to wipe itself.
 */
export const useSignOut = () => {
  const { t } = useTranslation("account");
  const signOut = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
      await forgetGoogleAccount();
    },
    onSettled: () => {
      events.emit("SignedOut");
    },
  });

  const confirmSignOut = () => {
    Alert.alert(t("signOut.confirmTitle"), t("signOut.confirmMessage"), [
      { text: t("signOut.cancel"), style: "cancel" },
      {
        text: t("signOut.confirm"),
        style: "destructive",
        onPress: () => signOut.mutate(),
      },
    ]);
  };

  return { confirmSignOut, isSigningOut: signOut.isPending };
};
