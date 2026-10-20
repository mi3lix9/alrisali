import { ENV } from "@/src/env";

/** The web domains whose https links open the app. */
export const LINK_HOSTS: readonly string[] = ENV.EXPO_PUBLIC_LINK_DOMAIN
  ? [ENV.EXPO_PUBLIC_LINK_DOMAIN]
  : [];
