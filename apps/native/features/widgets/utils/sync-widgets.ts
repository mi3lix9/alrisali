import type {
  WidgetEntry,
  WidgetLinks,
  WidgetText,
} from "@alrisali/domain/widgets";
import { WIDGET_KINDS, widgetProps } from "@alrisali/domain/widgets";
import { Platform } from "react-native";

import { ANDROID_SIZES } from "../data/android-sizes";
import { widgetRefresh } from "../data/widget-refresh";
import { WIDGETS } from "../definitions";

/**
 * Writes what every widget shows from now on. iOS gets a timeline, one entry
 * per moment something changes (each carrying only its own view); Android has
 * no timeline, so it gets all the views at once and an alarm at each moment to
 * draw again.
 */
export const syncWidgets = (
  entries: readonly WidgetEntry[],
  words: WidgetText,
  links: WidgetLinks
): void => {
  for (const kind of WIDGET_KINDS) {
    const widget = WIDGETS[kind];
    const props = widgetProps(kind, entries, words, links, ANDROID_SIZES[kind]);
    if (Platform.OS === "ios") {
      widget.updateTimeline(
        props.views.map((view) => ({
          date: new Date(view.from),
          props: { size: props.size, views: [view] },
        }))
      );
    } else {
      widget.updateSnapshot(props);
    }
  }
  widgetRefresh?.scheduleRefreshes(entries.slice(1).map(({ from }) => from));
};
