import { isDatabaseFile, openUserDatabase } from "@alrisali/db-user/shared";
import type {
  ConnectOptions,
  SyncedConnection,
  SyncOutcome,
  UserDatabase,
} from "@alrisali/db-user/shared";
import { captureException } from "@sentry/react-native";
import { connect, paths } from "@tursodatabase/sync-react-native";
import { Directory, File } from "expo-file-system";
import { useEffect } from "react";
import { AppState } from "react-native";

import {
  cloudDatabaseToken,
  cloudDatabaseUrl,
  connectCloudDatabase,
  disconnectCloudDatabase,
} from "./cloud-database";
import { createDebouncedTask } from "./debounced-task";
import { events } from "./events";
import { queryClient } from "./orpc";

/**
 * One database file for whoever uses the device; sign-out deletes it
 * (ADR-0002), so a Guest's file becomes the Believer's on sign-in.
 */
const DATABASE_FILE = "believer.db";

/** Every query over the Believer's database lives under this key. */
export const USER_DATA_QUERY_KEY = ["user-data"] as const;

// sync-react-native 0.8.3 returns rows as objects only (no raw mode), so
// `Object.values` restores column order. Alias duplicate column names in
// joins, or the later one wins.
const connectReactNative = async (
  options: ConnectOptions
): Promise<SyncedConnection> => {
  const database = await connect(options);
  return {
    execute: async (sql, params) => {
      await database.run(sql, [...params]);
    },
    query: async (sql, params) => {
      const rows = await database.all(sql, [...params]);
      return rows.map((row) => Object.values(row));
    },
    pull: () => database.pull(),
    push: () => database.push(),
    close: () => {
      database.close();
      return Promise.resolve();
    },
    destroy: () => {
      database.close();
      // The binding stores relative paths in its database directory.
      const directory = new Directory(`file://${paths.database}`);
      for (const entry of directory.list()) {
        if (entry instanceof File && isDatabaseFile(entry.name, options.path)) {
          entry.delete();
        }
      }
      return Promise.resolve();
    },
  };
};

let opening: Promise<UserDatabase> | undefined;

// Set below, where syncing is defined; the module sets it before any read
// can open the database, so no write goes unnoticed.
let afterWrite = (): void => undefined;

const open = async (): Promise<UserDatabase> => {
  try {
    return await openUserDatabase({
      path: DATABASE_FILE,
      // Null while the Believer is a Guest: the database stays in sync mode
      // with sync paused, and sign-in switches it on.
      remoteUrl: cloudDatabaseUrl,
      authToken: cloudDatabaseToken,
      connect: connectReactNative,
      onWrite: () => afterWrite(),
    });
  } catch (error) {
    // Let the next read try again rather than keep the failure.
    opening = undefined;
    throw error;
  }
};

/** The Believer's database, opened and migrated on first use. */
export const getUserDatabase = (): Promise<UserDatabase> => {
  opening ??= open();
  return opening;
};

let wiping: Promise<void> | undefined;

/**
 * Deletes the database from the device (ADR-0002); the next read opens a
 * fresh Guest database. Sign-out starts it; account deletion waits for the
 * same wipe before it restarts the app.
 */
export const wipeUserDatabase = (): Promise<void> => {
  wiping ??= (async () => {
    try {
      const current = opening;
      opening = undefined;
      if (current) {
        const database = await current;
        await database.wipe();
      }
      await queryClient.resetQueries({ queryKey: USER_DATA_QUERY_KEY });
    } finally {
      wiping = undefined;
    }
  })();
  return wiping;
};

/**
 * Syncs with the Believer's cloud database (paused for a Guest) and refreshes
 * every user-data query when the pull brought changes.
 */
const syncUserData = async (): Promise<SyncOutcome> => {
  const database = await getUserDatabase();
  await connectCloudDatabase();
  const outcome = await database.sync();
  if (outcome.status === "synced" && outcome.pulledChanges) {
    await queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
  }
  return outcome;
};

let lastSync: Promise<void> = Promise.resolve();

/**
 * Runs one sync after any already running: launch, foreground, writes and
 * sign-in can overlap, and a sign-in must not be skipped behind a paused
 * Guest sync.
 */
const queueSync = (): Promise<SyncOutcome> => {
  const previous = lastSync;
  const sync = (async () => {
    await previous;
    return syncUserData();
  })();
  lastSync = (async () => {
    try {
      await sync;
    } catch {
      // The caller reports it; the next sync runs regardless.
    }
  })();
  return sync;
};

const syncReportingErrors = async (): Promise<void> => {
  try {
    await queueSync();
  } catch (error) {
    // Offline or a failed sync is retried on the next foreground or write.
    captureException(error);
  }
};

/**
 * Pushes the signed-in Believer's pending records to their cloud database,
 * after any sync already running. Resolves true once they are there; false
 * or a rejection (offline) means they are still only on this device.
 */
export const pushUserData = async (): Promise<boolean> => {
  const outcome = await queueSync();
  return outcome.status === "synced";
};

/** How long the Believer's writes must pause before they are pushed. */
const PUSH_AFTER_WRITES_MS = 2000;

// A burst of writes (a Tasbih round, several ticks) syncs once it settles,
// so a signed-in Believer's records reach the cloud promptly. A Guest has
// nothing to push to.
const pushAfterWrites = createDebouncedTask({
  run: syncReportingErrors,
  delayMs: PUSH_AFTER_WRITES_MS,
});
afterWrite = () => {
  if (cloudDatabaseUrl() !== null) {
    pushAfterWrites.schedule();
  }
};

events.on("SignedOut", async () => {
  pushAfterWrites.cancel();
  disconnectCloudDatabase();
  try {
    await wipeUserDatabase();
  } catch (error) {
    captureException(error);
  }
});

// Sign-in creates the Believer's cloud database (first time only) and pushes
// everything they recorded as a Guest; a second device receives their data.
// Requests still in flight from before sign-in are dropped first.
events.on("SignedIn", () => {
  disconnectCloudDatabase();
  return syncReportingErrors();
});

/** Opens the database at launch and syncs on launch and on every foreground. */
export const useUserDataSync = (): void => {
  useEffect(() => {
    syncReportingErrors();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncReportingErrors();
      }
    });
    return () => subscription.remove();
  }, []);
};
