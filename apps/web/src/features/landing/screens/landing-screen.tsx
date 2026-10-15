import { Link } from "@tanstack/react-router";

import { StoreLinks } from "../components/store-links";
import { useSiteLocale } from "../hooks/use-site-locale";

export const LandingScreen = () => {
  const { copy, params } = useSiteLocale();
  const { home } = copy;

  return (
    <div className="container mx-auto grid max-w-5xl gap-16 px-4 py-12 md:py-20">
      <section className="grid gap-6">
        <p className="text-primary font-medium">{home.tagline}</p>
        <h1 className="max-w-3xl text-4xl leading-tight font-bold md:text-5xl">
          {home.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
          {home.description}
        </p>
        <div className="grid gap-3">
          <h2 className="font-semibold">{home.downloadHeading}</h2>
          <StoreLinks />
        </div>
      </section>

      <section className="grid gap-6">
        <h2 className="text-2xl font-semibold">{home.featuresHeading}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {home.features.map((feature) => (
            <li key={feature.title} className="grid gap-2 border p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <figure className="grid gap-2 border-y py-10 text-center">
        <blockquote
          lang="ar"
          dir="rtl"
          className="text-2xl font-semibold md:text-3xl"
        >
          {home.verse.text}
        </blockquote>
        {home.verse.translation && (
          <p className="text-muted-foreground">{home.verse.translation}</p>
        )}
        <figcaption className="text-muted-foreground text-sm">
          {home.verse.reference}
        </figcaption>
      </figure>

      <section className="grid justify-items-start gap-3">
        <p className="text-muted-foreground">{copy.contact.description}</p>
        <Link
          to="/{-$locale}/contact"
          params={params}
          className="hover:bg-muted border px-4 py-2 font-medium"
        >
          {copy.contact.title}
        </Link>
      </section>
    </div>
  );
};
