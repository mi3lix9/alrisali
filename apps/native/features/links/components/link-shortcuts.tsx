import "../i18n";
import { ICON_SHORTCUTS, linkFeatureId } from "@alrisali/domain/links";
import type { IconShortcutId } from "@alrisali/domain/links";
import type { FeatureId } from "@alrisali/domain/shared";
import { addListener, initial, setItems } from "expo-quick-actions";
import type { Action } from "expo-quick-actions";
import type { Href } from "expo-router";
import { router, useRootNavigationState } from "expo-router";
import { useEffect, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";

import { FEATURE_LINKS } from "@/shared/lib/features";

import { usePendingLink } from "../data/pending-link";
import { linkPath } from "../utils/resolve-link";

const open = (path: string) => {
  router.push(path as Href);
};

/**
 * The long-press shortcuts on the app icon, and the opening of what they and
 * links asked for before the app could show it: a link that arrived during
 * the first run opens when it ends. Renders nothing.
 */
export const LinkShortcuts = ({ onboarded }: { onboarded: boolean }) => {
  const { t } = useTranslation();
  const { t: tLinks } = useTranslation("links");
  const ready = Boolean(useRootNavigationState()?.key);

  useEffect(() => {
    const title: Record<IconShortcutId, string> = {
      qibla: t("features.qibla"),
      tasbih: t("features.tasbih"),
      "continue-reading": tLinks("shortcuts.continueReading"),
      "next-salah": tLinks("shortcuts.nextSalah"),
    };
    const publish = async () => {
      try {
        await setItems(
          ICON_SHORTCUTS.flatMap(({ id, link }) => {
            const path = linkPath(link);
            return path === null
              ? []
              : [
                  {
                    id,
                    title: title[id],
                    icon: `symbol:${FEATURE_LINKS[linkFeatureId(link) as FeatureId].icon.sf}`,
                    params: { path },
                  },
                ];
          })
        );
      } catch {
        // Shortcuts are a convenience; the app works without them.
      }
    };
    void publish();
  }, [t, tLinks]);

  // The initial action (a cold start from the icon) once, then each later one.
  const handle = useEffectEvent((action: Action) => {
    const path = action.params?.path;
    if (typeof path !== "string") {
      return;
    }
    // Before the navigator exists (a cold start from the icon) or the first
    // run is over, the route waits.
    if (ready && onboarded) {
      open(path);
    } else {
      usePendingLink.getState().hold(path);
    }
  });
  useEffect(() => {
    if (initial) {
      handle(initial);
    }
    const subscription = addListener(handle);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!(onboarded && ready)) {
      return;
    }
    const path = usePendingLink.getState().take();
    if (path !== null) {
      // After the shell has swapped onboarding for the tabs.
      setTimeout(() => open(path), 0);
    }
  }, [onboarded, ready]);

  return null;
};
