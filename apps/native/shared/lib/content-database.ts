import {
  createGlobalSettingsRepository,
  openContentReplica,
} from "@alrisali/db-content/shared";
import type {
  ContentReplica,
  ReplicaConnection,
  ReplicaConnectOptions,
} from "@alrisali/db-content/shared";
import { DEFAULT_HIJRI_ADJUSTMENT } from "@alrisali/domain/shared";
import { captureException } from "@sentry/react-native";
import { useQuery } from "@tanstack/react-query";
import { connect } from "@tursodatabase/sync-react-native";
import { useEffect } from "react";
import { AppState } from "react-native";

import { client, queryClient } from "./orpc";

/**
 * The device's pull-only copy of the content Admins publish (ADR-0001), for
 * Guests and Believers alike. It survives sign-out: nothing in it is
 * anyone's own. Reads work offline from whatever the last pull brought.
 */
const REPLICA_FILE = "content.db";

/** Every query over published content lives under this key. */
export const CONTENT_QUERY_KEY = ["content"] as const;

/** Fetch new access this long before the token expires. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

// Where the content database is and a read-only token for it, from the
// server; in memory only, so a launch stays offline until the server answers.
let access: { url: string; token: string; expiresAt: number } | null = null;
let fetchingAccess: Promise<string> | undefined;

const fetchAccess = async (): Promise<string> => {
  try {
    access = await client.contentReplica();
    return access.token;
  } finally {
    fetchingAccess = undefined;
  }
};

/** The token the sync engine sends with each request, cached until expiry. */
const replicaToken = (): Promise<string> => {
  if (access && access.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return Promise.resolve(access.token);
  }
  fetchingAccess ??= fetchAccess();
  return fetchingAccess;
};

// Only reads and pulls are adapted: the replica has no way to write or push.
// sync-react-native 0.8.3 returns rows as objects, so `Object.values`
// restores column order.
const connectReactNative = async (
  options: ReplicaConnectOptions
): Promise<ReplicaConnection> => {
  const database = await connect(options);
  return {
    query: async (sql, params) => {
      const rows = await database.all(sql, [...params]);
      return rows.map((row) => Object.values(row));
    },
    pull: () => database.pull(),
    close: () => {
      database.close();
      return Promise.resolve();
    },
  };
};

let opening: Promise<ContentReplica> | undefined;

const open = async (): Promise<ContentReplica> => {
  try {
    return await openContentReplica({
      path: REPLICA_FILE,
      remoteUrl: () => access?.url ?? null,
      authToken: replicaToken,
      connect: connectReactNative,
    });
  } catch (error) {
    opening = undefined;
    throw error;
  }
};

/** The content replica, opened once; content features read through it. */
export const getContentReplica = (): Promise<ContentReplica> => {
  opening ??= open();
  return opening;
};

/**
 * Asks the server where the content is, then pulls; refreshes every content
 * query when the pull brought changes. Offline, the copy stays as it was.
 */
const syncContent = async (): Promise<void> => {
  await replicaToken();
  const replica = await getContentReplica();
  const outcome = await replica.sync();
  if (outcome.status === "pulled" && outcome.pulledChanges) {
    await queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
  }
};

let lastSync: Promise<void> = Promise.resolve();

/** One content sync at a time: launch and foreground can overlap. */
const syncReportingErrors = (): Promise<void> => {
  const previous = lastSync;
  lastSync = (async () => {
    await previous;
    try {
      await syncContent();
    } catch (error) {
      // Offline or a failed pull is retried on the next foreground.
      captureException(error);
    }
  })();
  return lastSync;
};

/** Pulls published content at launch and on every foreground. */
export const useContentSync = (): void => {
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

/** The Admins' Hijri Adjustment from the replica (0 until first pulled). */
export const useGlobalHijriAdjustment = (): number => {
  const { data } = useQuery({
    queryKey: [...CONTENT_QUERY_KEY, "hijri-adjustment"],
    queryFn: async () => {
      const replica = await getContentReplica();
      return createGlobalSettingsRepository(replica.db).hijriAdjustment();
    },
  });
  return data ?? DEFAULT_HIJRI_ADJUSTMENT;
};
