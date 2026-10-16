import { visibleFeatures } from "./features";
import type { FeatureEntry } from "./features";
import type { HijriDate } from "./hijri";

/**
 * How the Believer arranged the Home shortcuts: every shortcut they have
 * arranged, in order, and which of those they hid. A shortcut added in a
 * later release is not in `order` yet, so it takes its registry default and
 * goes after the arranged ones.
 */
export interface ShortcutLayout<Id extends string = string> {
  order: Id[];
  hidden: Id[];
}

/** Nothing arranged: the registry's order and defaults. */
export const DEFAULT_SHORTCUT_LAYOUT: ShortcutLayout<never> = {
  order: [],
  hidden: [],
};

/** A shortcut in the editor: shown on Home or hidden. */
export interface ArrangedShortcut<F extends FeatureEntry> {
  feature: F;
  shown: boolean;
}

/**
 * Every feature that can be a shortcut, in the Believer's order, whether or
 * not it is in season: what the shortcut editor lists.
 */
export const arrangedShortcuts = <F extends FeatureEntry>(
  registry: readonly F[],
  layout: ShortcutLayout<F["id"]>
): ArrangedShortcut<F>[] => {
  const eligible = registry.filter((feature) => feature.shortcut !== undefined);
  const arranged = layout.order.flatMap((id) => {
    const feature = eligible.find((candidate) => candidate.id === id);
    return feature ? [{ feature, shown: !layout.hidden.includes(id) }] : [];
  });
  const added = eligible
    .filter((feature) => !layout.order.includes(feature.id))
    .map((feature) => ({ feature, shown: feature.shortcut === "shown" }));
  return [...arranged, ...added];
};

/** The shortcuts Home shows on a Hijri Date, in the Believer's order. */
export const homeShortcuts = <F extends FeatureEntry>(
  registry: readonly F[],
  layout: ShortcutLayout<F["id"]>,
  today: HijriDate
): F[] => {
  const visible = visibleFeatures(registry, today);
  return arrangedShortcuts(registry, layout)
    .filter(({ feature, shown }) => shown && visible.includes(feature))
    .map(({ feature }) => feature);
};

const toLayout = <F extends FeatureEntry>(
  arranged: readonly ArrangedShortcut<F>[]
): ShortcutLayout<F["id"]> => ({
  order: arranged.map(({ feature }) => feature.id),
  hidden: arranged
    .filter(({ shown }) => !shown)
    .map(({ feature }) => feature.id),
});

/** The layout after the Believer shows or hides one shortcut. */
export const setShortcutShown = <F extends FeatureEntry>(
  registry: readonly F[],
  layout: ShortcutLayout<F["id"]>,
  id: F["id"],
  shown: boolean
): ShortcutLayout<F["id"]> =>
  toLayout(
    arrangedShortcuts(registry, layout).map((shortcut) =>
      shortcut.feature.id === id ? { ...shortcut, shown } : shortcut
    )
  );

/**
 * The layout after the Believer drags the shortcut at `from` to `to`, both
 * positions in `arrangedShortcuts`; positions past either end are clamped.
 */
export const moveShortcut = <F extends FeatureEntry>(
  registry: readonly F[],
  layout: ShortcutLayout<F["id"]>,
  from: number,
  to: number
): ShortcutLayout<F["id"]> => {
  const arranged = arrangedShortcuts(registry, layout);
  const last = arranged.length - 1;
  const source = Math.min(Math.max(from, 0), last);
  const target = Math.min(Math.max(to, 0), last);
  const [moved] = arranged.splice(source, 1);
  if (moved) {
    arranged.splice(target, 0, moved);
  }
  return toLayout(arranged);
};

/**
 * A shortcut layout from a stored value of unknown shape, or null if it is
 * not one. Ids that are not shortcuts in this registry are dropped (a newer
 * app may have synced them), as are repeats.
 */
export const readShortcutLayout = <F extends FeatureEntry>(
  registry: readonly F[],
  stored: unknown
): ShortcutLayout<F["id"]> | null => {
  if (typeof stored !== "object" || stored === null) {
    return null;
  }
  const { order, hidden } = stored as Record<string, unknown>;
  if (!(Array.isArray(order) && Array.isArray(hidden))) {
    return null;
  }
  const known = new Set(
    registry.flatMap((feature) =>
      feature.shortcut === undefined ? [] : [feature.id]
    )
  );
  const arranged = order.filter(
    (id, index): id is F["id"] =>
      known.has(id as F["id"]) && order.indexOf(id) === index
  );
  return {
    order: arranged,
    hidden: arranged.filter((id) => hidden.includes(id)),
  };
};
