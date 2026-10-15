import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/shared/lib/auth-client";
import { events } from "@/shared/lib/events";

import type { ProviderIdToken } from "../utils/native-sign-in";

interface SignedIn {
  userId: string;
}

/** One way of signing in; resolves `null` when the Believer cancels. */
export type SignInAttempt = () => Promise<SignedIn | null>;

type AuthResult =
  | { data: { user: { id: string } } | object; error: null }
  | { data: null; error: { message?: string | undefined; statusText: string } };

const signedInFrom = ({ data, error }: AuthResult): SignedIn => {
  if (error) {
    throw new Error(error.message ?? error.statusText);
  }
  if (!("user" in data)) {
    throw new Error("Sign-in returned no Believer");
  }
  return { userId: data.user.id };
};

/** A native sheet's ID token, verified by the server. `null`: cancelled. */
export const signInWithSheet = async (
  showSheet: () => Promise<ProviderIdToken | null>
): Promise<SignedIn | null> => {
  const idToken = await showSheet();
  if (!idToken) {
    return null;
  }
  const { provider, ...rest } = idToken;
  return signedInFrom(
    await authClient.signIn.social({ provider, idToken: rest })
  );
};

export interface EmailCredentials {
  mode: "sign-in" | "sign-up";
  name: string;
  email: string;
  password: string;
}

/** Email and password: local development only (the server says when). */
export const signInWithEmail = async ({
  mode,
  name,
  email,
  password,
}: EmailCredentials): Promise<SignedIn> =>
  signedInFrom(
    mode === "sign-up"
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })
  );

/**
 * Signs a Believer in, from a native sheet (`signInWithSheet`) or email and
 * password (`signInWithEmail`). The session lands in SecureStore (the Expo auth
 * client), so it outlives a relaunch; `SignedIn` starts the rest (cloud
 * database, push device, analytics).
 */
export const useSignIn = () =>
  useMutation({
    mutationFn: (attempt: SignInAttempt) => attempt(),
    onSuccess: (signedIn) => {
      if (signedIn) {
        events.emit("SignedIn", signedIn);
      }
    },
  });
