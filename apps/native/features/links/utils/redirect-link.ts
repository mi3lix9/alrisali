import { LINK_SCHEME } from "@alrisali/domain/links";
import type { LinkTargets } from "@alrisali/domain/links";

import { LINK_HOSTS } from "../data/link-hosts";
import { usePendingLink } from "../data/pending-link";
import { HOME_PATH, resolveLink } from "./resolve-link";

const OURS = new RegExp(`^(?:${LINK_SCHEME}|https?):`, "iu");

/**
 * Whether Home is the right place for a URL that opens nothing: its scheme
 * is ours or the web's. Other URLs (the dev client's, a sign-in's return) are
 * the shell's to route, so they pass through.
 */
const ours = (url: string): boolean => OURS.test(url);

/**
 * Expo Router's hook for an incoming system link (cold start or while
 * running): the route to open. A URL that is not one of the app's links, or
 * names nothing, goes to Home. During the first run (`onboarded` false) the
 * route waits and the Believer lands on onboarding; it opens once the first
 * run is over.
 */
export const redirectLink = (
  url: string,
  { onboarded, targets }: { onboarded: boolean; targets: LinkTargets }
): string => {
  const path = resolveLink(url, LINK_HOSTS, targets);
  if (path === null) {
    return ours(url) ? HOME_PATH : url;
  }
  if (!onboarded) {
    usePendingLink.getState().hold(path);
    return HOME_PATH;
  }
  return path;
};
