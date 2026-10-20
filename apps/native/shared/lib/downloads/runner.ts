import { createKeyedSerial, downloadJobReducer } from "@alrisali/domain/shared";
import type {
  DownloadJob,
  DownloadJobEvent,
  DownloadKind,
} from "@alrisali/domain/shared";
import { File } from "expo-file-system";
import type { DownloadTask } from "expo-file-system";
import { create } from "zustand";

import {
  currentBlock,
  useConnectionState,
  watchConnection,
} from "./connection";
import {
  commitDownload,
  discardPartial,
  partFile,
  prepareGroup,
  storedUri,
} from "./store";

// Runs download jobs for every kind: a job is a batch of files for one group
// (a reciter's surah, an adhan). Files download a few at a time; pausing,
// going offline or leaving Wi-Fi with Wi-Fi only on pauses the transfers in
// flight, and they carry on from where they stopped.

const CONCURRENCY = 3;

export interface JobFile {
  name: string;
  url: string;
}

export interface JobSpec {
  id: string;
  kind: DownloadKind;
  group: string;
  /** Files still to download. */
  files: JobFile[];
  /** Files of the batch already on the device. */
  alreadyDone: number;
}

interface Runtime {
  spec: JobSpec;
  queue: JobFile[];
  tasks: Set<DownloadTask>;
  /** Names of the files this job has a `.part` file for. */
  writing: Set<string>;
  /** Transfers waiting to carry on, released when the job runs again. */
  waiting: (() => void)[];
  cancelled: boolean;
}

const useJobs = create<{ jobs: Record<string, DownloadJob> }>(() => ({
  jobs: {},
}));

/** Transfers to one destination run in turn: jobs overlap (a surah, its juz, the Quran). */
const destinations = createKeyedSerial();

const runtimes = new Map<string, Runtime>();

/** The jobs running, paused or waiting, by id. */
export const useDownloadJobs = (): Record<string, DownloadJob> =>
  useJobs((state) => state.jobs);

/** One job, or undefined when none is under way. */
export const useDownloadJob = (id: string): DownloadJob | undefined =>
  useJobs((state) => state.jobs[id]);

const isRunning = (id: string) =>
  useJobs.getState().jobs[id]?.status === "running";

/** Holds a paused transfer until its job runs again (or is cancelled). */
const untilRunning = (runtime: Runtime): Promise<void> =>
  // oxlint-disable-next-line promise/avoid-new -- the release is called from the job's next status change
  new Promise((resolve) => {
    runtime.waiting.push(resolve);
  });

const releaseWaiting = (runtime: Runtime) => {
  for (const release of runtime.waiting.splice(0)) {
    release();
  }
};

// The job's moving parts call each other (an event can start more transfers,
// a finished transfer is an event), so they share one object.
const engine = {
  dispatch(id: string, event: DownloadJobEvent) {
    const job = useJobs.getState().jobs[id];
    const runtime = runtimes.get(id);
    if (!(job && runtime)) {
      return;
    }
    const next = downloadJobReducer(job, event);
    if (next === job) {
      return;
    }
    useJobs.setState((state) => ({ jobs: { ...state.jobs, [id]: next } }));
    if (next.status === "done") {
      engine.finish(id);
    } else if (next.status === "running") {
      releaseWaiting(runtime);
      engine.pump(id);
    } else if (job.status === "running") {
      for (const task of runtime.tasks) {
        task.pause();
      }
    }
  },

  finish(id: string) {
    runtimes.delete(id);
    useJobs.setState((state) => {
      const { [id]: _done, ...rest } = state.jobs;
      return { jobs: rest };
    });
  },

  /** Carries a transfer to its end, holding it while its job is paused. */
  async complete(runtime: Runtime, task: DownloadTask, first: boolean) {
    const result = first
      ? await task.downloadAsync()
      : await task.resumeAsync();
    if (result !== null || runtime.cancelled) {
      return;
    }
    if (!isRunning(runtime.spec.id)) {
      await untilRunning(runtime);
    }
    if (!runtime.cancelled) {
      await engine.complete(runtime, task, false);
    }
  },

  async transfer(runtime: Runtime, file: JobFile) {
    const { kind, group, id } = runtime.spec;
    try {
      await destinations.run(`${kind}/${group}/${file.name}`, () =>
        engine.download(runtime, file)
      );
      if (!runtime.cancelled) {
        engine.dispatch(id, { type: "file-done" });
      }
    } catch {
      if (!runtime.cancelled) {
        discardPartial(kind, group, file.name);
        // Back at the front, so resuming tries it again.
        runtime.queue.unshift(file);
        engine.dispatch(id, { type: "failed" });
      }
    } finally {
      if (!runtime.cancelled) {
        engine.pump(id);
      }
    }
  },

  /** Downloads one file unless an overlapping job stored it while this one waited its turn. */
  async download(runtime: Runtime, file: JobFile) {
    const { kind, group } = runtime.spec;
    if (runtime.cancelled || storedUri(kind, group, file.name)) {
      return;
    }
    const task = File.createDownloadTask(
      file.url,
      partFile(kind, group, file.name)
    );
    runtime.tasks.add(task);
    runtime.writing.add(file.name);
    try {
      await engine.complete(runtime, task, true);
      if (!runtime.cancelled) {
        await commitDownload(kind, group, file.name);
      }
    } finally {
      runtime.tasks.delete(task);
      runtime.writing.delete(file.name);
    }
  },

  pump(id: string) {
    const runtime = runtimes.get(id);
    if (!runtime) {
      return;
    }
    while (
      isRunning(id) &&
      runtime.tasks.size < CONCURRENCY &&
      runtime.queue.length > 0
    ) {
      const file = runtime.queue.shift();
      if (file) {
        void engine.transfer(runtime, file);
      }
    }
  },
};

useConnectionState.subscribe(() => {
  const block = currentBlock();
  for (const id of runtimes.keys()) {
    engine.dispatch(id, { type: "connection", block });
  }
});

const begin = async (id: string) => {
  await watchConnection();
  engine.dispatch(id, { type: "connection", block: currentBlock() });
  engine.pump(id);
};

/** Starts a job, or returns to it when one for the same batch is under way. */
export const startDownload = (spec: JobSpec): void => {
  if (runtimes.has(spec.id) || spec.files.length === 0) {
    return;
  }
  prepareGroup(spec.kind, spec.group);
  runtimes.set(spec.id, {
    spec,
    queue: [...spec.files],
    tasks: new Set(),
    writing: new Set(),
    waiting: [],
    cancelled: false,
  });
  useJobs.setState((state) => ({
    jobs: {
      ...state.jobs,
      [spec.id]: {
        id: spec.id,
        kind: spec.kind,
        group: spec.group,
        total: spec.files.length + spec.alreadyDone,
        done: spec.alreadyDone,
        status: "running",
      },
    },
  }));
  void begin(spec.id);
};

export const pauseDownload = (id: string): void =>
  engine.dispatch(id, { type: "pause" });

/** Resumes a paused or failed job; it still waits if the connection does not allow it. */
export const resumeDownload = (id: string): void => {
  engine.dispatch(id, { type: "resume" });
  engine.dispatch(id, { type: "connection", block: currentBlock() });
};

/** Stops a job and deletes what it wrote so far; files it finished stay. */
export const cancelDownload = (id: string): void => {
  const runtime = runtimes.get(id);
  if (!runtime) {
    return;
  }
  runtime.cancelled = true;
  for (const task of runtime.tasks) {
    task.cancel();
  }
  releaseWaiting(runtime);
  const { kind, group } = runtime.spec;
  // Only what this job was writing: a part file another job owns is its own.
  for (const name of runtime.writing) {
    discardPartial(kind, group, name);
  }
  engine.finish(id);
};
