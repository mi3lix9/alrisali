import * as ScreenOrientation from "expo-screen-orientation";

/**
 * The app is portrait everywhere; the manifest allows landscape (`orientation:
 * "default"`) and this lock takes it away until a screen asks for it back.
 */
export const lockPortrait = (): void => {
  void ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP
  );
};
