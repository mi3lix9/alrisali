import type { RibbonColor } from "@alrisali/domain/quran";
import { View } from "react-native";

import { RIBBON_HEX } from "../utils/decorations";

/** A small hanging ribbon in one of the six colours. */
export const RibbonSwatch = ({ color }: { color: RibbonColor }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{
      width: 14,
      height: 24,
      backgroundColor: RIBBON_HEX[color],
      borderBottomLeftRadius: 7,
      borderBottomRightRadius: 7,
    }}
  />
);
