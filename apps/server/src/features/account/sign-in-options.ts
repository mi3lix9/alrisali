import { os } from "@/shared/lib/orpc";

/** Anyone may ask: sign-in screens show only the ways that work. */
export const signInOptions = os.account.signInOptions.handler(
  ({ context }) => ({
    providers: [...context.signInOptions.providers],
    emailPassword: context.signInOptions.emailPassword,
  })
);
