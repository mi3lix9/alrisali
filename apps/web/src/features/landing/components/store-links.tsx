import { ENV } from "@/env";

import { useSiteLocale } from "../hooks/use-site-locale";

const storeLinkClass =
  "flex min-w-44 flex-col items-start border border-foreground/20 bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-85";

export const StoreLinks = () => {
  const { copy } = useSiteLocale();
  const stores = [
    { ...copy.home.appStore, href: ENV.VITE_APP_STORE_URL },
    { ...copy.home.playStore, href: ENV.VITE_PLAY_STORE_URL },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {stores.map(({ label, caption, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={storeLinkClass}
        >
          <span className="text-xs">{caption}</span>
          <span className="text-lg font-semibold" dir="ltr">
            {label}
          </span>
        </a>
      ))}
    </div>
  );
};
