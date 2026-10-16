import type { FeatureId, Tab } from "@alrisali/domain/shared";
import type { Href } from "expo-router";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";

// The app's half of the Feature Registry (`FEATURES` in the domain): where
// each feature opens and its icon. Its label is the shell's
// `features.<id>` string. A tab feature also names its route in the tab bar.

export interface FeatureIcon {
  /** An SF Symbol, for iOS. */
  sf: SFSymbol;
  /** A Material Symbol, for Android. */
  md: AndroidSymbol;
}

export interface FeatureLink {
  href: Href;
  icon: FeatureIcon;
}

/** A tab feature's link also names its route in `app/(tabs)`. */
interface TabLink extends FeatureLink {
  tabRoute: string;
}

type FeatureLinks = {
  [Id in FeatureId]: Id extends Tab ? TabLink : FeatureLink;
};

export const FEATURE_LINKS: FeatureLinks = {
  home: { href: "/", icon: { sf: "house", md: "home" }, tabRoute: "(home)" },
  quran: { href: "/quran", icon: { sf: "book", md: "menu_book" } },
  prayer: {
    href: "/prayer",
    icon: { sf: "clock", md: "schedule" },
    tabRoute: "prayer",
  },
  qibla: { href: "/qibla", icon: { sf: "safari", md: "explore" } },
  "prayer-assistant": {
    href: "/prayer-assistant",
    icon: { sf: "figure.stand", md: "accessibility_new" },
  },
  library: {
    href: "/library",
    icon: { sf: "books.vertical", md: "local_library" },
    tabRoute: "library",
  },
  lessons: {
    href: "/library/lessons",
    icon: { sf: "graduationcap", md: "school" },
  },
  worship: {
    href: "/worship",
    icon: { sf: "sparkles", md: "self_improvement" },
    tabRoute: "worship",
  },
  programs: {
    href: "/worship/programs",
    icon: { sf: "checklist", md: "checklist" },
  },
  tasbih: {
    href: "/tasbih",
    icon: { sf: "circle.dotted", md: "blur_circular" },
    tabRoute: "tasbih",
  },
  calendar: {
    href: "/calendar",
    icon: { sf: "calendar", md: "calendar_month" },
  },
  gatherings: { href: "/gatherings", icon: { sf: "person.3", md: "groups" } },
  insights: { href: "/insights", icon: { sf: "chart.bar", md: "bar_chart" } },
  khatmah: { href: "/khatmah", icon: { sf: "target", md: "flag" } },
  timetable: {
    href: "/timetable",
    icon: { sf: "tablecells", md: "table_chart" },
  },
  imsakiyya: {
    href: "/imsakiyya",
    icon: { sf: "moon.stars", md: "bedtime" },
  },
};
