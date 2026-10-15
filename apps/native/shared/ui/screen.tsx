import type { ReactNode } from "react";
import { ScrollView } from "react-native";

/** A screen's scrolling body, inset under the native header and tab bar. */
export const Screen = ({ children }: { children?: ReactNode }) => (
  <ScrollView
    className="bg-background flex-1"
    contentContainerClassName="gap-4 p-4"
    contentInsetAdjustmentBehavior="automatic"
    keyboardShouldPersistTaps="handled"
  >
    {children}
  </ScrollView>
);
