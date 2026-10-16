import type { WidgetProps } from "@alrisali/domain/widgets";
import { HStack, ProgressView, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  tint,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import type { WidgetEnvironment } from "expo-widgets";

/**
 * Draws the view of `props` in force now: the last whose `from` has passed.
 * The system renders at each timeline entry, which the app dates at each
 * view's `from`.
 *
 * A widget runs in its own runtime, from this function's body alone: no
 * imports, no module constants, no helpers outside it.
 */
export const renderWidget = (
  props: WidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const now = environment.date ? environment.date.getTime() : Date.now();
  let [view] = props.views;
  for (const candidate of props.views) {
    if (candidate.from <= now) {
      view = candidate;
    }
  }
  const family = environment.widgetFamily;
  let size = 1;
  if (family === "systemMedium") {
    size = 2;
  } else if (family === "systemLarge" || family === "systemExtraLarge") {
    size = 3;
  }

  const dark = environment.colorScheme === "dark";
  const ink = dark ? "#F4F1EA" : "#1C1C19";
  const muted = dark ? "#A9A9A0" : "#6A6A62";
  const accent = dark ? "#7FCBA6" : "#1D7554";
  const paper = dark ? "#10150F" : "#FBF8F1";
  const toneColor = (tone: string) => {
    if (tone === "accent") {
      return accent;
    }
    return tone === "muted" ? muted : ink;
  };
  const fontOf = (style: string) => {
    switch (style) {
      case "caption": {
        return font({ size: 12, weight: "medium" });
      }
      case "title": {
        return font({ size: 20, weight: "bold" });
      }
      case "hero": {
        return font({ size: 44, weight: "bold" });
      }
      case "quran": {
        return font({ size: size === 1 ? 15 : 18, weight: "regular" });
      }
      default: {
        return font({ size: 14, weight: "regular" });
      }
    }
  };

  const blocks = (view ? view.blocks : []).filter((block) => block.min <= size);

  return (
    <VStack
      alignment="leading"
      spacing={4}
      modifiers={[
        padding({ all: 12 }),
        frame({ maxWidth: 10_000, maxHeight: 10_000, alignment: "topLeading" }),
        containerBackground(paper, "widget"),
        widgetURL(view ? view.link : "alrisali://next-salah"),
      ]}
    >
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return (
            <Text
              key={index}
              modifiers={[
                fontOf(block.style),
                foregroundStyle(toneColor(block.tone)),
                minimumScaleFactor(block.style === "quran" ? 0.7 : 0.8),
              ]}
            >
              {block.text}
            </Text>
          );
        }
        if (block.type === "countdown") {
          return (
            <Text
              key={index}
              timerInterval={{
                lower: new Date(now),
                upper: new Date(block.to),
              }}
              countsDown={true}
              modifiers={[
                font({ size: size === 1 ? 26 : 32, weight: "bold" }),
                monospacedDigit(),
                foregroundStyle(ink),
              ]}
            >
              {block.text}
            </Text>
          );
        }
        if (block.type === "row") {
          return (
            <HStack key={index}>
              <Text
                modifiers={[
                  font({
                    size: 14,
                    weight: block.strong ? "bold" : "regular",
                  }),
                  foregroundStyle(block.strong ? accent : ink),
                ]}
              >
                {block.label}
              </Text>
              <Spacer />
              <Text
                modifiers={[
                  font({
                    size: 14,
                    weight: block.strong ? "bold" : "regular",
                  }),
                  monospacedDigit(),
                  foregroundStyle(block.strong ? accent : muted),
                ]}
              >
                {block.value}
              </Text>
            </HStack>
          );
        }
        return (
          <ProgressView
            key={index}
            value={block.value}
            modifiers={[tint(accent)]}
          />
        );
      })}
      <Spacer />
    </VStack>
  );
};
