import type { ReactNode } from "react";

import { useSiteLocale } from "../hooks/use-site-locale";

/** The Contact page: its heading, with the form the route composes in. */
export const ContactScreen = ({ children }: { children: ReactNode }) => {
  const { copy } = useSiteLocale();

  return (
    <div className="container mx-auto grid max-w-2xl gap-6 px-4 py-10">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">{copy.contact.title}</h1>
        <p className="text-muted-foreground">{copy.contact.description}</p>
      </div>
      {children}
    </div>
  );
};
