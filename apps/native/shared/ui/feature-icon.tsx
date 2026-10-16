import type { FeatureId } from "@alrisali/domain/shared";
import { SymbolView } from "expo-symbols";
import { useCSSVariable } from "uniwind";

import { FEATURE_LINKS } from "@/shared/lib/features";
import type { FeatureIcon as FeatureIconNames } from "@/shared/lib/features";

/**
 * A decorative symbol in the text colour: an SF Symbol on iOS, a Material
 * Symbol on Android.
 */
export const SymbolIcon = ({
  sf,
  md,
  size = 24,
}: FeatureIconNames & { size?: number }) => {
  const color = useCSSVariable("--color-foreground");
  return (
    <SymbolView
      name={{ ios: sf, android: md }}
      size={size}
      {...(typeof color === "string" ? { tintColor: color } : {})}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
};

/** A feature's icon from the Feature Registry, the same one its tab shows. */
export const FeatureIcon = ({
  feature,
  size = 24,
}: {
  feature: FeatureId;
  size?: number;
}) => <SymbolIcon {...FEATURE_LINKS[feature].icon} size={size} />;
