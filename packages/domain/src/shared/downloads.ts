// Files the Believer keeps on the device on purpose: downloaded recitation
// and adhans. This is the pure model the downloads store and the Storage
// screen follow: what is stored, what a download may do on the current
// connection, and how a download job progresses. Streamed recitation is the
// 7-day cache, not a download.

export const DOWNLOAD_KINDS = ["recitation", "adhan"] as const;
export type DownloadKind = (typeof DOWNLOAD_KINDS)[number];

/** One downloaded file: `group` is the reciter or the adhan it belongs to. */
export interface StoredFile {
  kind: DownloadKind;
  group: string;
  name: string;
  bytes: number;
}

export interface StorageGroup {
  kind: DownloadKind;
  group: string;
  files: number;
  bytes: number;
}

export interface StorageKind {
  files: number;
  bytes: number;
  /** Largest first, ties by name. */
  groups: StorageGroup[];
}

export interface StorageSummary {
  bytes: number;
  kinds: Record<DownloadKind, StorageKind>;
}

const emptyKind = (): StorageKind => ({ files: 0, bytes: 0, groups: [] });

/** Totals for the Storage screen: per kind, and per reciter or adhan within it. */
export const summarizeStorage = (
  files: readonly StoredFile[]
): StorageSummary => {
  const kinds: Record<DownloadKind, StorageKind> = {
    recitation: emptyKind(),
    adhan: emptyKind(),
  };
  for (const file of files) {
    const kind = kinds[file.kind];
    kind.files += 1;
    kind.bytes += file.bytes;
    let group = kind.groups.find((entry) => entry.group === file.group);
    if (!group) {
      group = { kind: file.kind, group: file.group, files: 0, bytes: 0 };
      kind.groups.push(group);
    }
    group.files += 1;
    group.bytes += file.bytes;
  }
  for (const kind of DOWNLOAD_KINDS) {
    kinds[kind].groups.sort(
      (a, b) => b.bytes - a.bytes || a.group.localeCompare(b.group)
    );
  }
  return {
    bytes: DOWNLOAD_KINDS.reduce((sum, kind) => sum + kinds[kind].bytes, 0),
    kinds,
  };
};

/** How the device is connected, as far as downloading cares. */
export type Connection = "wifi" | "cellular" | "offline" | "unknown";

export type DownloadBlock = "offline" | "wifi-only";

/**
 * Why a download may not run now, or null when it may. With Wi-Fi only on,
 * a connection that is not known to be Wi-Fi blocks it.
 */
export const downloadBlock = ({
  wifiOnly,
  connection,
}: {
  wifiOnly: boolean;
  connection: Connection;
}): DownloadBlock | null => {
  if (connection === "offline") {
    return "offline";
  }
  return wifiOnly && connection !== "wifi" ? "wifi-only" : null;
};

export type DownloadJobStatus =
  | "running"
  | "paused"
  | "waiting-for-wifi"
  | "offline"
  | "failed"
  | "done";

/** A batch of files downloading together, e.g. one surah of one reciter. */
export interface DownloadJob {
  id: string;
  kind: DownloadKind;
  group: string;
  /** Files in the batch, counting those already on the device. */
  total: number;
  done: number;
  status: DownloadJobStatus;
}

export type DownloadJobEvent =
  | { type: "file-done" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "failed" }
  /** The connection or the Wi-Fi-only switch changed. */
  | { type: "connection"; block: DownloadBlock | null };

const BLOCKED_STATUS = {
  offline: "offline",
  "wifi-only": "waiting-for-wifi",
} as const;

/** Moves a download job on: the Believer pauses and resumes, the connection comes and goes. */
export const downloadJobReducer = (
  job: DownloadJob,
  event: DownloadJobEvent
): DownloadJob => {
  const waiting = job.status === "waiting-for-wifi" || job.status === "offline";
  if (event.type === "file-done") {
    const done = Math.min(job.total, job.done + 1);
    return { ...job, done, status: done >= job.total ? "done" : job.status };
  }
  if (event.type === "pause") {
    return job.status === "running" || waiting
      ? { ...job, status: "paused" }
      : job;
  }
  if (event.type === "resume") {
    return job.status === "paused" || job.status === "failed"
      ? { ...job, status: "running" }
      : job;
  }
  if (event.type === "failed") {
    return job.status === "running" ? { ...job, status: "failed" } : job;
  }
  if (job.status === "running" || waiting) {
    const status = event.block ? BLOCKED_STATUS[event.block] : "running";
    return status === job.status ? job : { ...job, status };
  }
  return job;
};
