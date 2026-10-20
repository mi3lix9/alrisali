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
  emailSignIn: {
    title: "Development: email and password",
    name: "Name",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signUp: "Create account",
    needAccount: "No account? Create one",
    haveAccount: "Have an account? Sign in",
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
    unsyncedTitle: "Some records aren't synced",
    unsyncedMessage:
      "Couldn't reach your cloud database. If you sign out now, what you recorded since the last sync is lost. Check your connection and try again, or sign out anyway.",
    signOutAnyway: "Sign out anyway",
  },
  deleteAccount: {
    title: "Delete account",
    description:
      "Permanently deletes your account and your cloud database, and returns this device to how it was on first launch.",
    button: "Delete account",
    confirmTitle: "Delete your account for good?",
    confirmMessage:
      "Everything you recorded is removed from your account and from this device, and can't be recovered. If you sign in again, you start with a new, empty account.",
    cancel: "Cancel",
    confirm: "Delete for good",
    failed:
      "Couldn't delete your account. Check your connection and try again.",
  },
  nudge: {
    title: "Your records aren't synced yet",
    message:
      "You have {{records}} only on this device. Sign in to keep them in your account and on any device.",
    records_zero: "no records",
    records_one: "{{count}} record",
    records_two: "{{count}} records",
    records_few: "{{count}} records",
    records_many: "{{count}} records",
    records_other: "{{count}} records",
    signIn: "Sign in",
    dismiss: "Not now",
  },
  export: {
    title: "Export my data",
    description:
      "A JSON file with everything you recorded on this device: prayer log, Tasbih, Favorites, habits, settings and more.",
    button: "Export JSON",
    failedTitle: "Couldn't export",
    failed: "The file couldn't be created or shared. Try again.",
    ok: "OK",
  },
};
