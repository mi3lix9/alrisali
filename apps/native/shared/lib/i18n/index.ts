import { textDirection } from "@alrisali/i18n";
import type { Language } from "@alrisali/i18n";
import { createInstance } from "i18next";
import type { FormatterModule } from "i18next";
import { initReactI18next } from "react-i18next";

import { localizeDigits } from "../numbers";
import { launchLanguage, usePreferences } from "../preferences";
import { ar } from "./common.ar";
import { en } from "./common.en";

// Typed catalogues: every namespace is declared in `ResourceNamespaceMap`
// with its Arabic catalogue's type, so `t()` rejects a key that does not
// exist. The shell owns `common`; each feature registers its own namespace
// from its `i18n/` folder with `registerCatalog` and augments the map:
//
//   declare module "i18next" {
//     interface ResourceNamespaceMap { settings: typeof ar }
//   }
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
  }
  interface ResourceNamespaceMap {
    common: typeof ar;
  }
}

export const i18n = createInstance();

// Every value interpolated into a string passes through here
// (`alwaysFormat`): a number is written in the interface's digits, so
// `t("…", { count: 3 })` reads "٣" or "3" without each call formatting it.
// Plural forms are still picked from the raw `count`. Numbers are written
// as they are, without grouping ("1448" for a Hijri year); a call that wants
// "1,234" passes `formatNumber(value)`. Strings pass through untouched, as
// they may be the Believer's own text.
// i18next calls init, add and addCached on a formatter; this one has no
// named formats to set up or add.
/* oxlint-disable no-empty-function -- the formatter API requires them */
const digitsFormatter: FormatterModule = {
  type: "formatter",
  init: () => {},
  // A value that is not a number passes through, and i18next writes it as
  // it would have.
  format: (value) =>
    typeof value === "number" ? localizeDigits(String(value)) : value,
  add: () => {},
  addCached: () => {},
};
/* oxlint-enable no-empty-function */

// A change of digits re-renders every `useTranslation` caller, as a change of
// language would.
const DIGITS_CHANGED = "digitsChanged";

void i18n
  .use(initReactI18next)
  .use(digitsFormatter)
  .init({
    lng: launchLanguage,
    resources: { ar: { common: ar }, en: { common: en } },
    ns: ["common"],
    defaultNS: "common",
    initAsync: false,
    interpolation: { escapeValue: false, alwaysFormat: true },
    react: { bindI18n: `languageChanged ${DIGITS_CHANGED}` },
  });

usePreferences.subscribe((state, previous) => {
  if (state.digits !== previous.digits) {
    i18n.emit(DIGITS_CHANGED);
  }
});

/** Adds a feature's catalogues under its namespace. */
export const registerCatalog = (
  namespace: string,
  catalogs: Record<Language, object>
): void => {
  for (const [language, catalog] of Object.entries(catalogs)) {
    i18n.addResourceBundle(language, namespace, catalog);
  }
};

/** The layout direction this launch runs in, from its language. */
export const launchDirection = textDirection(launchLanguage);
