import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  guest: {
    title: "You're using the app as a Guest",
    description:
      "Everything you record is kept on this device. Sign in to sync it to your own cloud database and take it to any device.",
  },
  signIn: {
    google: "Continue with Google",
    failed: "Couldn't sign in. Please try again.",
  },
  believer: {
    signedInAs: "Signed in as",
  },
  signOut: {
    button: "Sign out",
    confirmTitle: "Sign out?",
    confirmMessage:
      "Your data will be removed from this device. It stays in your account and comes back when you sign in again.",
    cancel: "Cancel",
    confirm: "Sign out",
  },
};
