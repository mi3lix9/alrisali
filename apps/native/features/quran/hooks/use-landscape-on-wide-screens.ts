import { canRotateReader } from "@alrisali/domain/quran";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import { Dimensions } from "react-native";

import { lockPortrait } from "@/shared/lib/orientation";

/**
 * Lets the screen turn to landscape on a tablet or unfolded foldable, and
 * locks portrait again when it closes. Phones stay in portrait.
 */
export const useLandscapeOnWideScreens = (): void => {
  useEffect(() => {
    if (!canRotateReader(Dimensions.get("window"))) {
      return;
    }
    void ScreenOrientation.unlockAsync();
    return lockPortrait;
  }, []);
};
