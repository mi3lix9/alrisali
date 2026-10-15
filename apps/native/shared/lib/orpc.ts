import type { AppRouterClient } from "@alrisali/api";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

import { ENV } from "@/src/env";

import { authClient } from "./auth-client";
import { events } from "./events";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.log(error);
    },
  }),
});

// Cached server data belongs to whoever was signed in when it was fetched.
events.on("SignedIn", () => {
  queryClient.refetchQueries();
});
events.on("SignedOut", () => {
  queryClient.invalidateQueries();
});

const expoFetch = async (request: Request, init?: RequestInit) => {
  const { fetch } = await import("expo/fetch");

  return fetch(request.url, {
    body: await request.blob(),
    headers: request.headers,
    method: request.method,
    signal: request.signal,
    ...init,
  });
};

export const link = new RPCLink({
  url: `${ENV.EXPO_PUBLIC_SERVER_URL}/rpc`,
  fetch(request, init) {
    return expoFetch(request, {
      ...init,
      // Better Auth Expo forwards the session cookie manually on native.
      credentials: Platform.OS === "web" ? "include" : "omit",
    });
  },
  async headers() {
    if (Platform.OS === "web") {
      return {};
    }
    const headers = new Map<string, string>();
    const cookies = await authClient.getCookie();
    if (cookies) {
      headers.set("Cookie", cookies);
    }
    return Object.fromEntries(headers);
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
