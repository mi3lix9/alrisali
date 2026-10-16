import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

/** What the Android-only `modules/widget-refresh` offers. */
interface WidgetRefreshModule {
  /**
   * Replaces every armed refresh with these moments (epoch milliseconds): at
   * each, with the app closed, the home-screen widgets draw again.
   */
  scheduleRefreshes: (times: readonly number[]) => void;
}

/**
 * The widget refresh module, or null on iOS (its widgets follow the timeline
 * the app wrote) and in a build made without it.
 */
export const widgetRefresh: WidgetRefreshModule | null =
  Platform.OS === "android"
    ? requireOptionalNativeModule<WidgetRefreshModule>("WidgetRefresh")
    : null;
