// Test support for other packages (the server's router tests): the content
// replica over the Node Turso sync binding, the same engine as the device's.
// Never bundled.
import { connect } from "@tursodatabase/sync";

import type {
  ReplicaConnection,
  ReplicaConnectOptions,
} from "../shared/replica";

export const connectNodeReplica = async (
  options: ReplicaConnectOptions
): Promise<ReplicaConnection> => {
  const database = await connect(options);
  return {
    query: async (sql, params) => {
      const statement = await database.prepare(sql);
      return statement.raw(true).all(...params);
    },
    pull: () => database.pull(),
    close: () => database.close(),
  };
};
