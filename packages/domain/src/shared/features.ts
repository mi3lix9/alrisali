import { isInHijriWindow } from "./hijri";
import type { HijriDate, HijriWindow } from "./hijri";

/** The areas All Tools groups features into, in the order it shows them. */
export const FEATURE_AREAS = [
  "quran",
  "prayer",
  "worship",
  "library",
  "seasonal",
  "more",
] as const;

export type FeatureArea = (typeof FEATURE_AREAS)[number];

/**
 * One entry of a Feature Registry. Where it opens, its icon and its label
 * belong to the app; the registry decides where it appears.
 */
export interface FeatureEntry {
  readonly id: string;
  /** Its group on All Tools; Home has none, as All Tools is reached from it. */
  readonly area?: FeatureArea;
  /** A seasonal feature appears only within this window. */
  readonly window?: HijriWindow;
  /** Whether it has a tab in the tab bar. */
  readonly tab?: boolean;
  /**
   * Whether it can be a Home shortcut, and if so whether it is one until the
   * Believer chooses.
   */
  readonly shortcut?: "shown" | "hidden";
}

/**
 * The Feature Registry: every feature the app offers, in the order the tab
 * bar, the Home shortcuts and All Tools list them unless the Believer
 * arranges otherwise.
 */
export const FEATURES = [
  { id: "home", tab: true },
  { id: "quran", area: "quran", shortcut: "shown" },
  { id: "prayer", area: "prayer", tab: true, shortcut: "shown" },
  { id: "qibla", area: "prayer", shortcut: "shown" },
  { id: "prayer-assistant", area: "prayer", shortcut: "shown" },
  { id: "library", area: "library", tab: true, shortcut: "hidden" },
  { id: "lessons", area: "library", shortcut: "hidden" },
  { id: "worship", area: "worship", tab: true, shortcut: "hidden" },
  { id: "programs", area: "worship", shortcut: "hidden" },
  { id: "tasbih", area: "worship", tab: true, shortcut: "shown" },
  { id: "calendar", area: "worship", shortcut: "shown" },
  { id: "gatherings", area: "more", shortcut: "hidden" },
  { id: "insights", area: "more", shortcut: "shown" },
] as const satisfies readonly FeatureEntry[];

export type Feature = (typeof FEATURES)[number];

export type FeatureId = Feature["id"];

/**
 * The features a Believer sees on a Hijri Date: every one without a window,
 * and a seasonal one only within its window. Registry order is kept.
 */
export const visibleFeatures = <F extends FeatureEntry>(
  registry: readonly F[],
  today: HijriDate
): F[] =>
  registry.filter(
    (feature) =>
      feature.window === undefined || isInHijriWindow(today, feature.window)
  );

/** One area's features on All Tools. */
export interface FeatureGroup<F extends FeatureEntry> {
  area: FeatureArea;
  features: F[];
}

/**
 * All Tools: every visible feature that has an area, grouped by area in
 * `FEATURE_AREAS` order; an area with nothing visible is left out.
 */
export const featuresByArea = <F extends FeatureEntry>(
  registry: readonly F[],
  today: HijriDate
): FeatureGroup<F>[] => {
  const visible = visibleFeatures(registry, today);
  return FEATURE_AREAS.flatMap((area) => {
    const features = visible.filter((feature) => feature.area === area);
    return features.length > 0 ? [{ area, features }] : [];
  });
};
