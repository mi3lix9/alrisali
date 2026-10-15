import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { authClient } from "@/shared/lib/auth-client";
import { events } from "@/shared/lib/events";
import { pushUserData } from "@/shared/lib/user-database";

import "../i18n";
import { forgetGoogleAccount } from "../utils/native-sign-in";
import { signOutAfterPush } from "../utils/sign-out-flow";

// `SignedOut` follows even when the server call fails: the session is
// already gone from the device.
const signOutOfDevice = async (): Promise<void> => {
  try {
    await authClient.signOut();
    await forgetGoogleAccount();
  } finally {
    events.emit("SignedOut");
  }
};

/**
 * Signs the Believer out after they confirm that this device's data goes
 * with them. Their pending records are pushed first; when that fails
 * (offline), they choose between keeping the records on the device and
 * signing out anyway. The auth client drops the SecureStore session before
 * it calls the server, so signing out works offline too. `SignedOut` tells
 * the device database to wipe itself.
 */
export const useSignOut = () => {
  const { t } = useTranslation("account");

  const confirmLosingRecords = () =>
    // oxlint-disable-next-line promise/avoid-new -- Alert answers through callbacks
    new Promise<boolean>((resolve) => {
      Alert.alert(
        t("signOut.unsyncedTitle"),
        t("signOut.unsyncedMessage"),
        [
          {
            text: t("signOut.cancel"),
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: t("signOut.signOutAnyway"),
            style: "destructive",
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });

  const signOut = useMutation({
    mutationFn: () =>
      signOutAfterPush({
        push: pushUserData,
        confirmLosingRecords,
        signOut: signOutOfDevice,
      }),
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
