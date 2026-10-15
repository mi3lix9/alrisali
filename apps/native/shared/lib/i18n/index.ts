import { textDirection } from "@alrisali/i18n";
import type { Language } from "@alrisali/i18n";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { launchLanguage } from "../preferences";
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

void i18n.use(initReactI18next).init({
  lng: launchLanguage,
  resources: { ar: { common: ar }, en: { common: en } },
  ns: ["common"],
  defaultNS: "common",
  initAsync: false,
  interpolation: { escapeValue: false },
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
