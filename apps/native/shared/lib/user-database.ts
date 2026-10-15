import { openUserDatabase } from "@alrisali/db-user/shared";
import type {
  ConnectOptions,
  SyncedConnection,
  UserDatabase,
} from "@alrisali/db-user/shared";
import { captureException } from "@sentry/react-native";
import { connect } from "@tursodatabase/sync-react-native";
import { useEffect } from "react";
import { AppState } from "react-native";

import { queryClient } from "./orpc";

/**
 * One database file for whoever uses the device; sign-out deletes it
 * (ADR-0002), so a Guest's file becomes the Believer's on sign-in.
 */
const DATABASE_FILE = "believer.db";

/** Every query over the Believer's database lives under this key. */
export const USER_DATA_QUERY_KEY = ["user-data"] as const;

/**
 * The Believer's cloud database URL. Null while they are a Guest, which keeps
 * the database in sync mode with sync paused; sign-in supplies the URL.
 */
const remoteUrl = (): string | null => null;

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
  };
};

let opening: Promise<UserDatabase> | undefined;

/** The Believer's database, opened and migrated on first use. */
export const getUserDatabase = (): Promise<UserDatabase> => {
  opening ??= openUserDatabase({
    path: DATABASE_FILE,
    remoteUrl,
    connect: connectReactNative,
  });
  return opening;
};

/**
 * Syncs with the Believer's cloud database (paused for a Guest) and refreshes
 * every user-data query when the pull brought changes.
 */
const syncUserData = async (): Promise<void> => {
  const database = await getUserDatabase();
  const outcome = await database.sync();
  if (outcome.status === "synced" && outcome.pulledChanges) {
    await queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
  }
};

const syncReportingErrors = async (): Promise<void> => {
  try {
    await syncUserData();
  } catch (error) {
    // Offline or a failed sync is retried on the next foreground.
    captureException(error);
  }
};

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
