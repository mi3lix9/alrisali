import { registerCatalog } from "@/shared/lib/i18n";

import { ar } from "./ar";
import { en } from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    qibla: typeof ar;
  }
}

registerCatalog("qibla", { ar, en });
