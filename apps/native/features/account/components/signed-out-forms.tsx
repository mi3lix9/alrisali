import { authClient } from "@/shared/lib/auth-client";

import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

/** Sign-in and sign-up, shown only while no Believer is signed in. */
export const SignedOutForms = () => {
  const { data: session } = authClient.useSession();

  if (session?.user) {
    return null;
  }

  return (
    <>
      <SignInForm />
      <SignUpForm />
    </>
  );
};
