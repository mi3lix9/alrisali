import { shareableLinkUrl } from "@alrisali/domain/links";
import type { AppLink } from "@alrisali/domain/links";
import { Share } from "react-native";

import { ENV } from "@/src/env";

/** Opens the share sheet with a link to `link`, after an optional line of text. */
export const shareLink = (
  link: AppLink,
  message?: string
): Promise<unknown> => {
  const url = shareableLinkUrl(link, ENV.EXPO_PUBLIC_LINK_DOMAIN);
  return Share.share({ message: message ? `${message}\n${url}` : url });
};
