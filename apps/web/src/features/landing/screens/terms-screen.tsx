import { LegalPage } from "../components/legal-page";
import { useSiteLocale } from "../hooks/use-site-locale";

export const TermsScreen = () => {
  const { copy } = useSiteLocale();
  return <LegalPage document={copy.terms} />;
};
