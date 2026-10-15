import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/shared/lib/auth-client";
import { events } from "@/shared/lib/events";

import type { ProviderIdToken } from "../utils/native-sign-in";

/**
 * Signs a Believer in from a native sheet's ID token. The session lands in
 * SecureStore (the Expo auth client), so it outlives a relaunch.
 */
export const useSignIn = () =>
  useMutation({
    mutationFn: async (
      showSheet: () => Promise<ProviderIdToken | null>
    ): Promise<{ userId: string } | null> => {
      const idToken = await showSheet();
      if (!idToken) {
        return null;
      }
      const { provider, ...rest } = idToken;
      const { data, error } = await authClient.signIn.social({
        provider,
        idToken: rest,
      });
      if (error) {
        throw new Error(error.message ?? error.statusText);
      }
      if (!("user" in data)) {
        throw new Error("Sign-in returned no Believer");
      }
      return { userId: data.user.id };
    },
    onSuccess: (signedIn) => {
      if (signedIn) {
        events.emit("SignedIn", signedIn);
      }
    },
  });
