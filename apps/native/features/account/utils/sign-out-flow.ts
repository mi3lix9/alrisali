export interface SignOutSteps {
  /**
   * Pushes the Believer's pending records to their cloud database. Resolves
   * true once they are there; false or a rejection (offline) leaves them
   * only on this device.
   */
  push: () => Promise<boolean>;
  /** Asks whether to sign out anyway and lose the unsynced records. */
  confirmLosingRecords: () => Promise<boolean>;
  /** Signs out; the device database is wiped after it. */
  signOut: () => Promise<void>;
}

export type SignOutOutcome = "signedOut" | "cancelled";

/**
 * Sign-out wipes this device's database (ADR-0002), so the records must
 * reach the cloud first. When they cannot, the Believer decides: cancel
 * keeps everything on the device, or sign out anyway.
 */
export const signOutAfterPush = async ({
  push,
  confirmLosingRecords,
  signOut,
}: SignOutSteps): Promise<SignOutOutcome> => {
  const pushed = await push().catch(() => false);
  if (!pushed && !(await confirmLosingRecords())) {
    return "cancelled";
  }
  await signOut();
  return "signedOut";
};
