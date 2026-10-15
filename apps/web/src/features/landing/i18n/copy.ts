import type { LegalDocument } from "@alrisali/i18n/legal";

export interface SiteCopy {
  appName: string;
  nav: {
    home: string;
    privacy: string;
    terms: string;
    contact: string;
    /** Label of the link to the other language, written in that language. */
    otherLanguage: string;
  };
  home: {
    metaTitle: string;
    metaDescription: string;
    tagline: string;
    title: string;
    description: string;
    downloadHeading: string;
    appStore: { label: string; caption: string };
    playStore: { label: string; caption: string };
    featuresHeading: string;
    features: readonly { title: string; description: string }[];
    verse: { text: string; translation?: string; reference: string };
  };
  privacy: LegalDocument;
  terms: LegalDocument;
  contact: {
    title: string;
    description: string;
  };
}
