import { registerCatalog } from "@/shared/lib/i18n";

import { ar } from "./ar";
import { en } from "./en";
import { progressAr } from "./progress-ar";
import { progressEn } from "./progress-en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    khatmah: typeof ar;
    khatmahProgress: typeof progressAr;
  }
}

registerCatalog("khatmah", { ar, en });
registerCatalog("khatmahProgress", { ar: progressAr, en: progressEn });
