import type { WidgetProps } from "@alrisali/domain/widgets";
import {
  Button,
  Column,
  LinearProgressIndicator,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
} from "@expo/ui/jetpack-compose/modifiers";
import type { WidgetEnvironment } from "expo-widgets";

/**
 * Draws the view of `props` in force now: the last whose `from` has passed.
 * Android has no timeline: the app's alarm at each `from` makes the system
 * render again (modules/widget-refresh). Android gives the layout no size or
 * date: the size comes in the props, the time from the clock. The Android
 * widget runtime (Glance, through Expo UI) has no chronometer or timer text,
 * so the countdown cannot tick on its own: in the last hour before the Prayer
 * Time it shows the hours:minutes left as of this draw (the app arms an alarm
 * every minute of that hour, `countdownTicks`), and before that the Prayer
 * Time's clock time.
 *
 * A widget runs in its own runtime, from this function's body alone: no
 * imports, no module constants, no helpers outside it.
 */
export const renderWidget = (
  props: WidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const now = Date.now();
  let [view] = props.views;
  for (const candidate of props.views) {
    if (candidate.from <= now) {
      view = candidate;
    }
  }
  const { size } = props;

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
  const sizeOf = (style: string) => {
    switch (style) {
      case "caption": {
        return 12;
      }
      case "title": {
        return 20;
      }
      case "hero": {
        return 44;
      }
      case "quran": {
        return size === 1 ? 15 : 18;
      }
      default: {
        return 14;
      }
    }
  };

  const blocks = (view ? view.blocks : []).filter((block) => block.min <= size);

  return (
    // `target` is what the Android widget runtime reads from a Button to
    // open a Link on a tap (patches/expo-widgets); the Expo UI types lack it.
    <Button
      {...{ target: `open:${view ? view.link : "alrisali://next-salah"}` }}
      modifiers={[fillMaxSize(), background(paper), cornerRadius(20)]}
    >
      <Column modifiers={[fillMaxWidth(), paddingAll(12)]}>
        {blocks.map((block, index) => {
          if (block.type === "text") {
            return (
              <Text
                key={index}
                color={toneColor(block.tone)}
                style={{
                  fontSize: sizeOf(block.style),
                  fontWeight:
                    block.style === "title" || block.style === "hero"
                      ? "bold"
                      : "normal",
                }}
              >
                {block.text}
              </Text>
            );
          }
          if (block.type === "countdown") {
            const left = block.to - now;
            let shown = block.text;
            if (left > 0 && left <= block.window) {
              const minutes = Math.ceil(left / 60_000);
              const rest = minutes % 60;
              const time = `${Math.floor(minutes / 60)}:${rest < 10 ? "0" : ""}${rest}`;
              const local = time
                .split("")
                .map((char) => block.digits[Number(char)] ?? char)
                .join("");
              shown = block.remaining.replace("{time}", local);
            }
            return (
              <Text
                key={index}
                color={ink}
                style={{ fontSize: 28, fontWeight: "bold" }}
              >
                {shown}
              </Text>
            );
          }
          if (block.type === "row") {
            return (
              <Text
                key={index}
                color={block.strong ? accent : ink}
                style={{
                  fontSize: 14,
                  fontWeight: block.strong ? "bold" : "normal",
                }}
              >
                {`${block.label}   ${block.value}`}
              </Text>
            );
          }
          return (
            <LinearProgressIndicator
              key={index}
              progress={block.value}
              color={accent}
              modifiers={[fillMaxWidth()]}
            />
          );
        })}
      </Column>
    </Button>
  );
};
