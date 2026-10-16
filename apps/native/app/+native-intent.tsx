import { getSupplication } from "@alrisali/content/books";
import { findAyah, isPage, isSurah } from "@alrisali/domain/quran";

import { redirectLink } from "@/features/links";
import { isOnboarded } from "@/features/onboarding";

// Every link the system hands the app (`alrisali://…` or a universal link),
// at cold start or while it runs, is routed here. A link may name only what
// the Quran and the Books hold.
export const redirectSystemPath = ({
  path,
}: {
  path: string;
  initial: boolean;
}): string =>
  redirectLink(path, {
    onboarded: isOnboarded(),
    targets: {
      hasAyah: (key) => findAyah(key) !== undefined,
      hasSupplication: (id) => getSupplication(id) !== undefined,
      isPage,
      isSurah,
    },
  });
