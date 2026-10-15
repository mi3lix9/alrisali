import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

const subscribeAppState = (onChange: () => void) => {
  const subscription = AppState.addEventListener("change", onChange);
  return () => subscription.remove();
};

/** Whether the app is in the foreground: the camera runs only then. */
export const useForeground = (): boolean =>
  useSyncExternalStore(
    subscribeAppState,
    () => AppState.currentState === "active"
  );
