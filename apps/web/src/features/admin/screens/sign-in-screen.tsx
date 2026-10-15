import type { WebSignInProvider } from "@alrisali/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/shared/lib/auth-client";
import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

const PROVIDER_LABELS: Record<WebSignInProvider, string> = {
  apple: "Sign in with Apple",
  google: "Sign in with Google",
};

/**
 * Admins sign in with the Apple or Google account they use in the app: the
 * same account, on the phone and the web. Only an account given the Admin
 * role (`bun run admin:grant <email>` in apps/server) gets past the admin
 * pages. A button shows for each provider the server has web credentials for.
 */
export const SignInScreen = () => {
  const providers = useQuery(orpc.account.webSignInProviders.queryOptions());
  const signIn = useMutation({
    mutationFn: async (provider: WebSignInProvider) => {
      const { origin } = window.location;
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: `${origin}/admin`,
        errorCallbackURL: `${origin}/admin/login`,
      });
      if (error) {
        throw new Error(error.message ?? error.statusText);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <main className="mx-auto mt-10 flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-center text-3xl font-bold">Admin sign-in</h1>
      <p className="text-muted-foreground text-center">
        Use the Apple or Google account you sign in to the app with.
      </p>
      {providers.isPending ? <Loader /> : null}
      {providers.isError ? (
        <p className="text-destructive">
          Could not reach the server: {providers.error.message}
        </p>
      ) : null}
      {providers.data?.providers.length === 0 ? (
        <p className="text-muted-foreground text-center">
          No sign-in provider is configured on the server.
        </p>
      ) : null}
      {providers.data?.providers.map((provider) => (
        <Button
          key={provider}
          className="w-full"
          disabled={signIn.isPending}
          onClick={() => signIn.mutate(provider)}
        >
          {PROVIDER_LABELS[provider]}
        </Button>
      ))}
    </main>
  );
};
