import { useSiteLocale } from "../hooks/use-site-locale";

export const ContactScreen = () => {
  const { copy } = useSiteLocale();

  return (
    <div className="container mx-auto grid max-w-2xl gap-2 px-4 py-10">
      <h1 className="text-3xl font-bold">{copy.contact.title}</h1>
      <p className="text-muted-foreground">{copy.contact.description}</p>
    </div>
  );
};
