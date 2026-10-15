import type { ContractRouterClient } from "@orpc/contract";

import { accountContract } from "./account";
import { sharedContract } from "./shared";

// The whole oRPC API: each feature's contract under its own key. The server
// implements it; the apps call it through a client typed from it.
export const contract = {
  ...sharedContract,
  account: accountContract,
};

export type AppRouterClient = ContractRouterClient<typeof contract>;
