import type { Locale } from "../utils/locale";
import { ar } from "./ar";
import type { SiteCopy } from "./copy";
import { en } from "./en";

export const siteCopy: Record<Locale, SiteCopy> = { ar, en };
