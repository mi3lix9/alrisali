import { useSegments } from "expo-router";
import { useEffect } from "react";

import { startUsageAnalytics, trackEvent } from "../data/usage-analytics";

/**
 * Mount once under the router: starts usage analytics and counts a screen
 * view each time the route changes. The screen is named by its route pattern
 * without groups (`quran/[page]`, `settings`), never by its parameters.
 */
export const UsageAnalytics = () => {
  const name =
    useSegments()
      .filter((segment) => !segment.startsWith("("))
      .join("/") || "home";

  useEffect(startUsageAnalytics, []);
  useEffect(() => {
    trackEvent({ type: "screen_view", name });
  }, [name]);

  return null;
};
