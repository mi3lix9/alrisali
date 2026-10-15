import { registerCatalog } from "@/shared/lib/i18n";

import { ar } from "./ar";
import { en } from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    reminders: typeof ar;
  }
}

registerCatalog("reminders", { ar, en });
