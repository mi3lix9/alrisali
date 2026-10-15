import { Spinner } from "panelui-native";

import { authClient } from "@/shared/lib/auth-client";
import { Screen } from "@/shared/ui/screen";

import { BelieverCard } from "../components/believer-card";
import { SignInCard } from "../components/sign-in-card";

/**
 * The signed-in Believer, or a Guest's sign-in. The session is read from the
 * SecureStore cache first, so a relaunch shows the Believer even offline.
 */
export const AccountScreen = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  return (
    <Screen>
      {session ? <BelieverCard believer={session.user} /> : <SignInCard />}
    </Screen>
  );
};
