import { getSupplication, TAQIBAT } from "@alrisali/content/books";
import type { SupplicationEntry } from "@alrisali/content/books";

import type { Salah } from "../shared/salah";

/**
 * The Supplication a Taqibat shortcut opens after this Salah, or undefined
 * while no taqibat for it is bundled.
 */
export const taqibatFor = (salah: Salah): SupplicationEntry | undefined => {
  const id = TAQIBAT[salah];
  return id === undefined ? undefined : getSupplication(id);
};
