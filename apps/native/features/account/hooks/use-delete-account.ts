import { captureException } from "@sentry/react-native";
import { useMutation } from "@tanstack/react-query";
import { reloadAppAsync } from "expo";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { authClient } from "@/shared/lib/auth-client";
import { forgetDeviceEntries } from "@/shared/lib/device-entries";
import { events } from "@/shared/lib/events";
import { client } from "@/shared/lib/orpc";
import { wipeUserDatabase } from "@/shared/lib/user-database";

import "../i18n";
import { forgetGoogleAccount } from "../utils/native-sign-in";

/**
 * Returns the device to its first-run state once the account is gone. Each
 * step runs even when one before it fails, and the app restarts regardless:
 * nothing would let the Believer retry a deletion the server already made.
 */
const resetDevice = async (): Promise<void> => {
  const steps = [
    // The server already ended the session; this drops its SecureStore copy.
    () => authClient.signOut(),
    forgetGoogleAccount,
    () => {
      events.emit("SignedOut");
      return wipeUserDatabase();
    },
    forgetDeviceEntries,
  ];
  for (const step of steps) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- one step after another
      await step();
    } catch (error) {
      captureException(error);
    }
  }
  await reloadAppAsync();
};

/**
 * Deletes the Believer's account after they confirm (Apple guideline
 * 5.1.1(v)). The server destroys their cloud database and auth rows; then
 * the device forgets the session, wipes its database and preferences, and
 * restarts in its first-run state. Nothing on the device changes unless the
 * server deleted the account, so a failed request can simply be retried.
 */
export const useDeleteAccount = () => {
  const { t } = useTranslation("account");
  const deleteAccount = useMutation({
    mutationFn: async () => {
      await client.account.deleteAccount();
      await resetDevice();
    },
    onError: () => {
      Alert.alert(t("deleteAccount.failed"));
    },
  });

  const confirmDeleteAccount = () => {
    Alert.alert(
      t("deleteAccount.confirmTitle"),
      t("deleteAccount.confirmMessage"),
      [
        { text: t("deleteAccount.cancel"), style: "cancel" },
        {
          text: t("deleteAccount.confirm"),
          style: "destructive",
          onPress: () => deleteAccount.mutate(),
        },
      ]
    );
  };

  return { confirmDeleteAccount, isDeleting: deleteAccount.isPending };
};
