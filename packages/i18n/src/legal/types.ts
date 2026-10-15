export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
  items?: readonly string[];
}

export interface LegalDocument {
  title: string;
  description: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
}

/** The Privacy Policy and Terms of Service, in one language. */
export interface LegalDocuments {
  privacy: LegalDocument;
  terms: LegalDocument;
}
