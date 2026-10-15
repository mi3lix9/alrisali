import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import {
  AppleAuthenticationScope,
  signInAsync,
} from "expo-apple-authentication";
import { randomUUID } from "expo-crypto";

import { ENV } from "@/src/env";

/** What a native sheet hands back for the server to verify. */
export interface ProviderIdToken {
  provider: "apple" | "google";
  token: string;
  nonce?: string;
  /** Apple sends the Believer's name only on their first sign-in. */
  user?: { name: { firstName: string; lastName: string } };
}

const APPLE_CANCELLED = "ERR_REQUEST_CANCELED";

const isAppleCancel = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === APPLE_CANCELLED;

GoogleSignin.configure({
  webClientId: ENV.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: ENV.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

/** Shows Apple's sheet. Resolves `null` when the Believer cancels. */
export const appleIdToken = async (): Promise<ProviderIdToken | null> => {
  const nonce = randomUUID();
  try {
    const credential = await signInAsync({
      requestedScopes: [
        AppleAuthenticationScope.FULL_NAME,
        AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });
    if (!credential.identityToken) {
      throw new Error("Apple returned no identity token");
    }
    const firstName = credential.fullName?.givenName ?? "";
    const lastName = credential.fullName?.familyName ?? "";
    return {
      provider: "apple",
      token: credential.identityToken,
      nonce,
      ...(firstName || lastName
        ? { user: { name: { firstName, lastName } } }
        : {}),
    };
  } catch (error) {
    if (isAppleCancel(error)) {
      return null;
    }
    throw error;
  }
};

/**
 * Shows Apple's sheet again before account deletion: its authorization code
 * is what the server exchanges for the token Apple revokes. Resolves `null`
 * when the Believer cancels.
 */
export const appleAuthorizationCode = async (): Promise<string | null> => {
  try {
    const { authorizationCode } = await signInAsync();
    if (!authorizationCode) {
      throw new Error("Apple returned no authorization code");
    }
    return authorizationCode;
  } catch (error) {
    if (isAppleCancel(error)) {
      return null;
    }
    throw error;
  }
};

/** Shows Google's sheet. Resolves `null` when the Believer cancels. */
export const googleIdToken = async (): Promise<ProviderIdToken | null> => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    return null;
  }
  if (!response.data.idToken) {
    throw new Error("Google returned no ID token");
  }
  return { provider: "google", token: response.data.idToken };
};

/** Forgets the Google account so the next Google sign-in offers the chooser. */
export const forgetGoogleAccount = async (): Promise<void> => {
  if (GoogleSignin.hasPreviousSignIn()) {
    await GoogleSignin.signOut();
  }
};
