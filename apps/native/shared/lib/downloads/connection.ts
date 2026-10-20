import { downloadBlock } from "@alrisali/domain/shared";
import type { Connection, DownloadBlock } from "@alrisali/domain/shared";
import {
  addNetworkStateListener,
  getNetworkStateAsync,
  NetworkStateType,
} from "expo-network";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { deviceEntry } from "../device-entries";

// Whether downloads wait for Wi-Fi, and what the device is connected to. The
// switch is the device's own (a Believer on a metered plan on one phone),
// so it is a device entry, not synced; it starts on.

const WIFI_ONLY_KEY = deviceEntry("downloads.wifi-only");

const toConnection = (type: NetworkStateType | undefined): Connection => {
  if (type === NetworkStateType.WIFI || type === NetworkStateType.ETHERNET) {
    return "wifi";
  }
  if (type === NetworkStateType.CELLULAR) {
    return "cellular";
  }
  return type === NetworkStateType.NONE ? "offline" : "unknown";
};

interface ConnectionState {
  wifiOnly: boolean;
  connection: Connection;
}

export const useConnectionState = create<ConnectionState>(() => ({
  wifiOnly: SecureStore.getItem(WIFI_ONLY_KEY) !== "off",
  connection: "unknown",
}));

/** Turns Wi-Fi only on or off. */
export const setWifiOnly = (wifiOnly: boolean): void => {
  SecureStore.setItem(WIFI_ONLY_KEY, wifiOnly ? "on" : "off");
  useConnectionState.setState({ wifiOnly });
};

/** Whether downloads wait for Wi-Fi. */
export const useWifiOnly = (): boolean =>
  useConnectionState((state) => state.wifiOnly);

/** Why a download may not run now, or null. */
export const currentBlock = (): DownloadBlock | null =>
  downloadBlock(useConnectionState.getState());

let watching = false;

/** Reads the connection now and follows it; safe to call again. */
export const watchConnection = async (): Promise<void> => {
  if (!watching) {
    watching = true;
    addNetworkStateListener((event) =>
      useConnectionState.setState({ connection: toConnection(event.type) })
    );
  }
  try {
    const state = await getNetworkStateAsync();
    useConnectionState.setState({ connection: toConnection(state.type) });
  } catch {
    // Unknown: with Wi-Fi only on, that blocks; with it off, downloads go on.
  }
};
