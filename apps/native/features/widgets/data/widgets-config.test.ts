import { describe, expect, it } from "vitest";

import { WIDGETS } from "../../../app.config";
import { ANDROID_SIZES } from "./android-sizes";
import { WIDGET_NAMES } from "./names";

const LAYOUT = "features/widgets/definitions.ts";

describe("the home-screen widgets in the app config", () => {
  it("list every widget the app registers, and no other", () => {
    expect(WIDGETS.map(({ name }) => name).toSorted()).toStrictEqual(
      Object.values(WIDGET_NAMES).toSorted()
    );
  });

  it("run the layout file the native builds draw before the app first opens", () => {
    for (const widget of WIDGETS) {
      expect(widget.ios.initialLayout).toBe(LAYOUT);
      expect(widget.android.initialLayout).toBe(LAYOUT);
    }
  });

  it("add each Android widget at the size its layout is drawn for", () => {
    for (const [kind, name] of Object.entries(WIDGET_NAMES)) {
      const widget = WIDGETS.find((candidate) => candidate.name === name);
      // Two cells wide is the small layout, four the medium one.
      const expected = widget?.android.targetCellWidth === 2 ? 1 : 2;
      expect(ANDROID_SIZES[kind as keyof typeof ANDROID_SIZES]).toBe(expected);
    }
  });
});
