import type { ReactNode } from "react";
import { ScrollView } from "react-native";

/**
 * A screen's scrolling body, inset under the native header and tab bar. The
 * keyboard insets it too, so a focused field below the fold scrolls into
 * view instead of staying under the keyboard.
 */
export const Screen = ({ children }: { children?: ReactNode }) => (
  <ScrollView
    className="bg-background flex-1"
    automaticallyAdjustKeyboardInsets
    contentContainerClassName="gap-4 p-4"
    contentInsetAdjustmentBehavior="automatic"
    keyboardShouldPersistTaps="handled"
  >
    {children}
  </ScrollView>
);
