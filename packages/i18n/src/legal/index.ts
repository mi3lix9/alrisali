import type { Language } from "../index";
import { ar } from "./ar";
import { en } from "./en";
import type { LegalDocuments } from "./types";

export type { LegalDocument, LegalDocuments, LegalSection } from "./types";

/**
 * The Privacy Policy and Terms of Service, shared by the web pages and the
 * app's Privacy and Terms screens so the two never disagree.
 */
export const legalDocuments: Record<Language, LegalDocuments> = { ar, en };
