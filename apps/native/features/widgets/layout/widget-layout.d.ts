import type { WidgetProps } from "@alrisali/domain/widgets";
import type { WidgetEnvironment } from "expo-widgets";

/**
 * Draws a widget from its props. The implementation is per platform
 * (`widget-layout.ios.tsx`, `widget-layout.android.tsx`): iOS widgets are
 * SwiftUI, Android widgets Glance, and each runs in the widget's own isolated
 * runtime, where only its own function body exists.
 */
export declare const renderWidget: (
  props: WidgetProps,
  environment: WidgetEnvironment
) => React.JSX.Element;
