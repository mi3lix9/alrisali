import { describe, expect, it } from "vitest";

import { readShareRequest, shareRequestParams } from "./share-route";
import type { ShareRequest } from "./share-route";

const TIMES = {
  title: "مواقيت الصلاة",
  subtitle: "القطيف",
  rows: [{ label: "الفجر", time: "04:22" }],
  footer: null,
};

describe(readShareRequest, () => {
  it.each<ShareRequest>([
    { kind: "ayah", ayah: "2:255" },
    { kind: "supplication", id: "mafatih-dua-kumayl" },
    { kind: "times", times: TIMES },
  ])("reads back a $kind request", (request) => {
    expect(readShareRequest(shareRequestParams(request))).toStrictEqual(
      request
    );
  });

  it("refuses params that name nothing to share", () => {
    expect(readShareRequest({})).toBeNull();
    expect(readShareRequest({ kind: "ayah", ayah: "x" })).toBeNull();
    expect(readShareRequest({ kind: "times", times: "{" })).toBeNull();
  });
});
