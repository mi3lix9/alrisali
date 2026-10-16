import { registerCatalog } from "@/shared/lib/i18n";

import { ar } from "./ar";
import { en } from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    "prayer-log": typeof ar;
  }
}

registerCatalog("prayer-log", { ar, en });
