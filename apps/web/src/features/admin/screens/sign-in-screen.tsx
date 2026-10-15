import { useState } from "react";

import SignInForm from "../components/sign-in-form";
import SignUpForm from "../components/sign-up-form";

/**
 * Email and password sign-in. Anyone may create an account, but only an
 * account given the Admin role (`bun run admin:grant <email>` in apps/server)
 * gets past the admin pages.
 */
export const SignInScreen = () => {
  const [showSignUp, setShowSignUp] = useState(false);

  return showSignUp ? (
    <SignUpForm onSwitchToSignIn={() => setShowSignUp(false)} />
  ) : (
    <SignInForm onSwitchToSignUp={() => setShowSignUp(true)} />
  );
};
