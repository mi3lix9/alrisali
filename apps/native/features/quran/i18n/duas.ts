import { registerCatalog } from "@/shared/lib/i18n";

import { duasAr } from "./duas-ar";
import { duasEn } from "./duas-en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    quranDuas: typeof duasAr;
  }
}

registerCatalog("quranDuas", { ar: duasAr, en: duasEn });
