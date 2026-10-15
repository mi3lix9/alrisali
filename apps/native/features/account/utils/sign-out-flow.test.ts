import { describe, expect, it, vi } from "vitest";

import { signOutAfterPush } from "./sign-out-flow";
import type { SignOutSteps } from "./sign-out-flow";

const steps = (push: SignOutSteps["push"], confirmed = false) => {
  const calls: string[] = [];
  return {
    calls,
    push: vi.fn<SignOutSteps["push"]>(() => {
      calls.push("push");
      return push();
    }),
    confirmLosingRecords: vi.fn<SignOutSteps["confirmLosingRecords"]>(() => {
      calls.push("confirm");
      return Promise.resolve(confirmed);
    }),
    signOut: vi.fn<SignOutSteps["signOut"]>(() => {
      calls.push("signOut");
      return Promise.resolve();
    }),
  };
};

describe(signOutAfterPush, () => {
  it("pushes the Believer's records before signing out and wiping", async () => {
    const flow = steps(() => Promise.resolve(true));

    await expect(signOutAfterPush(flow)).resolves.toBe("signedOut");

    expect(flow.calls).toStrictEqual(["push", "signOut"]);
  });

  it("asks before losing records it could not push, and cancel keeps them", async () => {
    const flow = steps(() => Promise.reject(new Error("offline")));

    await expect(signOutAfterPush(flow)).resolves.toBe("cancelled");

    expect(flow.calls).toStrictEqual(["push", "confirm"]);
    expect(flow.signOut).not.toHaveBeenCalled();
  });

  it("signs out anyway once the Believer accepts losing unsynced records", async () => {
    const flow = steps(() => Promise.resolve(false), true);

    await expect(signOutAfterPush(flow)).resolves.toBe("signedOut");

    expect(flow.calls).toStrictEqual(["push", "confirm", "signOut"]);
  });
});
