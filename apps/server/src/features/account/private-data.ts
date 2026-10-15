import { authed } from "@/shared/lib/orpc";

export const privateData = authed.account.privateData.handler(
  ({ context }) => ({
    message: "This is private",
    user: context.session.user,
  })
);
