import { os } from "@/shared/lib/orpc";

/** Anyone may ask: the sign-in page shows a button per provider. */
export const webSignInProviders = os.account.webSignInProviders.handler(
  ({ context }) => ({ providers: [...context.webSignInProviders] })
);
