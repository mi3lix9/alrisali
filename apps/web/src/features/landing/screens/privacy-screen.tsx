import { LegalPage } from "../components/legal-page";
import { useSiteLocale } from "../hooks/use-site-locale";

export const PrivacyScreen = () => {
  const { copy } = useSiteLocale();
  return <LegalPage document={copy.privacy} />;
};
