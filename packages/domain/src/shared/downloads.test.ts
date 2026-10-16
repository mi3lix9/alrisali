import { describe, expect, it } from "vitest";

import { downloadBlock, downloadJobReducer, summarizeStorage } from ".";
import type { DownloadJob, DownloadJobEvent } from ".";

describe(summarizeStorage, () => {
  it("totals files by kind and by reciter, largest first", () => {
    const summary = summarizeStorage([
      { kind: "recitation", group: "ar.husary", name: "a.mp3", bytes: 100 },
      { kind: "recitation", group: "ar.alafasy", name: "a.mp3", bytes: 300 },
      { kind: "recitation", group: "ar.alafasy", name: "b.mp3", bytes: 200 },
      { kind: "adhan", group: "makkah", name: "adhan.mp3", bytes: 50 },
    ]);
    expect(summary.bytes).toBe(650);
    expect(summary.kinds.recitation.bytes).toBe(600);
    expect(summary.kinds.recitation.groups).toStrictEqual([
      { kind: "recitation", group: "ar.alafasy", files: 2, bytes: 500 },
      { kind: "recitation", group: "ar.husary", files: 1, bytes: 100 },
    ]);
    expect(summary.kinds.adhan.files).toBe(1);
  });

  it("is empty with nothing downloaded", () => {
    expect(summarizeStorage([]).bytes).toBe(0);
  });
});

describe(downloadBlock, () => {
  it("blocks cellular with Wi-Fi only on", () => {
    expect(downloadBlock({ wifiOnly: true, connection: "cellular" })).toBe(
      "wifi-only"
    );
  });

  it("allows cellular with Wi-Fi only off", () => {
    expect(
      downloadBlock({ wifiOnly: false, connection: "cellular" })
    ).toBeNull();
  });

  it("allows Wi-Fi either way", () => {
    expect(downloadBlock({ wifiOnly: true, connection: "wifi" })).toBeNull();
  });

  it("blocks when offline whatever the switch says", () => {
    expect(downloadBlock({ wifiOnly: false, connection: "offline" })).toBe(
      "offline"
    );
  });
});

const run = (start: DownloadJob, ...events: DownloadJobEvent[]) => {
  let job = start;
  for (const event of events) {
    job = downloadJobReducer(job, event);
  }
  return job;
};

describe(downloadJobReducer, () => {
  const job: DownloadJob = {
    id: "j",
    kind: "recitation",
    group: "ar.alafasy",
    total: 2,
    done: 0,
    status: "running",
  };

  it("finishes when every file is done", () => {
    expect(run(job, { type: "file-done" }, { type: "file-done" }).status).toBe(
      "done"
    );
  });

  it("waits for Wi-Fi on cellular and goes on when Wi-Fi returns", () => {
    const waiting = run(job, { type: "connection", block: "wifi-only" });
    expect(waiting.status).toBe("waiting-for-wifi");
    expect(run(waiting, { type: "connection", block: null }).status).toBe(
      "running"
    );
  });

  it("stays paused through connection changes until resumed", () => {
    const paused = run(job, { type: "pause" });
    expect(run(paused, { type: "connection", block: null }).status).toBe(
      "paused"
    );
    expect(run(paused, { type: "resume" }).status).toBe("running");
  });

  it("can be paused while waiting for Wi-Fi", () => {
    expect(
      run(job, { type: "connection", block: "offline" }, { type: "pause" })
        .status
    ).toBe("paused");
  });

  it("resumes after a failure and keeps its progress", () => {
    const failed = run(job, { type: "file-done" }, { type: "failed" });
    expect(failed.status).toBe("failed");
    expect(run(failed, { type: "resume" })).toMatchObject({
      status: "running",
      done: 1,
    });
  });
});
