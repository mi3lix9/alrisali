import * as SecureStore from "expo-secure-store";

// What the app keeps on the device outside the Believer's database: the
// small SecureStore entries read synchronously at startup (preferences and
// the like). Each owner names its entry through `deviceEntry`, so account
// deletion can return the device to its first-run state without knowing
// every feature.

const entries = new Set<string>();

/** Registers a SecureStore key the device keeps; returns the key. */
export const deviceEntry = (key: string): string => {
  entries.add(key);
  return key;
};

/** Deletes every registered entry: the next launch reads the defaults. */
export const forgetDeviceEntries = async (): Promise<void> => {
  await Promise.all(
    [...entries].map((key) => SecureStore.deleteItemAsync(key))
  );
};
