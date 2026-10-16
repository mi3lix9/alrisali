import { createFileRoute } from "@tanstack/react-router";

import { ContactForm } from "@/features/contact";
import { ContactScreen, parseLocaleParam, siteHead } from "@/features/landing";

const ContactRoute = () => {
  const { locale } = Route.useParams();
  return (
    <ContactScreen>
      <ContactForm language={parseLocaleParam(locale) ?? "ar"} />
    </ContactScreen>
  );
};

export const Route = createFileRoute("/{-$locale}/contact")({
  head: siteHead("contact"),
  component: ContactRoute,
});
