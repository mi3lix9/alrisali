import { os } from "./orpc";

/** Open to everyone: Guests read published content too. */
export const contentReplica = os.contentReplica.handler(({ context }) =>
  context.content.replicaAccess()
);
