/** The app's tabs, in tab-bar order. Home is always shown. */
export const TABS = ["home", "prayer", "library", "worship", "tasbih"] as const;

export type Tab = (typeof TABS)[number];

/** The tab that cannot be hidden. */
export const ALWAYS_SHOWN_TAB = "home" satisfies Tab;

/**
 * The Believer's choice is stored as the tabs they hid, not the ones they
 * show, so a tab added in a later release appears for everyone.
 */
export const DEFAULT_HIDDEN_TABS: readonly Tab[] = [];

const isHideable = (value: unknown): value is Tab =>
  value !== ALWAYS_SHOWN_TAB && TABS.some((tab) => tab === value);

/** The tabs to show, in tab-bar order. */
export const visibleTabs = (hidden: readonly Tab[]): Tab[] =>
  TABS.filter((tab) => tab === ALWAYS_SHOWN_TAB || !hidden.includes(tab));

/** The hidden tabs after the Believer turns `tab` on or off. */
export const setTabVisible = (
  hidden: readonly Tab[],
  tab: Tab,
  visible: boolean
): Tab[] =>
  TABS.filter(
    (candidate) =>
      isHideable(candidate) &&
      (candidate === tab ? !visible : hidden.includes(candidate))
  );

/**
 * Hidden tabs from a stored value of unknown shape: anything that is not a
 * hideable tab is dropped, as are repeats.
 */
export const readHiddenTabs = (stored: unknown): Tab[] =>
  Array.isArray(stored)
    ? TABS.filter((tab) => isHideable(tab) && stored.includes(tab))
    : [];
