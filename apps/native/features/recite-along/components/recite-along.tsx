import "../i18n";
import {
  tokenizeText,
  usesVoice,
  withoutVoice,
} from "@alrisali/domain/recite-along";
import type { ReciteToken } from "@alrisali/domain/recite-along";
import { Direction } from "panelui-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ComponentRef, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { useRecitePreferences } from "../hooks/use-recite-preferences";
import { useReciteProgress } from "../hooks/use-recite-progress";
import { useVoiceFollow, useVoiceSupport } from "../hooks/use-voice";
import { ReciteControls } from "./recite-controls";
import { ReciteLine } from "./recite-line";
import type { LineRow } from "./recite-line";

/** Keep the word being written between these fractions of the viewport. */
const FOLLOW_TOP = 0.15;
const FOLLOW_BOTTOM = 0.65;
/** Where a followed word lands after scrolling, as a viewport fraction. */
const FOLLOW_TARGET = 1 / 3;

interface WordPlace {
  line: number;
  /** Character offset of the word in its rendered line. */
  offset: number;
}

/** Where each matchable word sits, as rendered by `ReciteLine`. */
const placeWords = (lines: readonly (readonly ReciteToken[])[]) => {
  const places: WordPlace[] = [];
  for (const [line, tokens] of lines.entries()) {
    let offset = 0;
    for (const token of tokens) {
      if (token.wordIndex !== null) {
        places[token.wordIndex] = { line, offset };
      }
      // Each token is followed by one space.
      offset += token.text.length + 1;
    }
  }
  return places;
};

export interface ReciteAlongProps {
  /** The Arabic text; blank lines separate paragraphs. */
  text: string;
  fontSize: number;
  /** Shown above the text, scrolling with it. */
  header?: ReactElement;
}

/**
 * Highlights each Arabic word as the Believer recites, by holding the text, at
 * a timed pace, by voice or by voice and hold together, and keeps the word
 * being written in view.
 */
export const ReciteAlong = ({ text, fontSize, header }: ReciteAlongProps) => {
  const { t } = useTranslation("recite-along");
  const { mode: chosen, pace } = useRecitePreferences();
  const voice = useVoiceSupport(usesVoice(chosen));
  // Without speech the voice methods fall back to holding the text.
  const mode = voice.support?.usable === false ? withoutVoice(chosen) : chosen;
  const { lines, words } = useMemo(() => tokenizeText(text), [text]);
  const places = useMemo(() => placeWords(lines), [lines]);
  const [progress, dispatch] = useReciteProgress(mode, pace, words.length);
  useVoiceFollow({ words, progress, dispatch, voice });
  const { count } = progress;

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const textTop = useRef(0);
  const lineTops = useRef<number[]>([]);
  const lineRows = useRef<LineRow[][]>([]);
  const viewport = useRef({ top: 0, height: 0, insetTop: 0 });

  const onLineLayout = useCallback((index: number, top: number) => {
    lineTops.current[index] = top;
  }, []);
  const onLineRows = useCallback((index: number, rows: LineRow[]) => {
    lineRows.current[index] = rows;
  }, []);

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const insetTop = nativeEvent.contentInset.top;
    viewport.current = {
      top: nativeEvent.contentOffset.y + insetTop,
      height:
        nativeEvent.layoutMeasurement.height -
        insetTop -
        nativeEvent.contentInset.bottom,
      insetTop,
    };
  };

  useEffect(() => {
    const place = places[Math.min(count, places.length - 1)];
    const { top, height, insetTop } = viewport.current;
    if (!place || height <= 0) {
      return;
    }
    const row = (lineRows.current[place.line] ?? []).findLast(
      (candidate) => candidate.start <= place.offset
    );
    const y =
      textTop.current + (lineTops.current[place.line] ?? 0) + (row?.y ?? 0);
    if (y < top + height * FOLLOW_TOP || y > top + height * FOLLOW_BOTTOM) {
      scroll.current?.scrollTo({
        y: Math.max(-insetTop, y - insetTop - height * FOLLOW_TARGET),
        animated: true,
      });
    }
  }, [count, places]);

  return (
    <View className="bg-background flex-1">
      <ScrollView
        ref={scroll}
        className="flex-1"
        contentContainerClassName="p-4"
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={100}
        onScroll={onScroll}
        onLayout={(event) => {
          if (viewport.current.height === 0) {
            viewport.current.height = event.nativeEvent.layout.height;
          }
        }}
      >
        {header}
        <Direction
          dir="rtl"
          onLayout={(event) => {
            textTop.current = event.nativeEvent.layout.y;
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("text.label")}
            accessibilityHint={t("text.hint")}
            onPressIn={() => dispatch({ type: "press" })}
            onPressOut={() => dispatch({ type: "release" })}
          >
            {lines.map((tokens, index) =>
              tokens.length === 0 ? (
                // oxlint-disable-next-line react/no-array-index-key -- lines never reorder
                <View key={index} className="h-2" />
              ) : (
                <ReciteLine
                  // oxlint-disable-next-line react/no-array-index-key -- lines never reorder
                  key={index}
                  index={index}
                  tokens={tokens}
                  reached={Math.max(
                    -1,
                    Math.min(
                      tokens.length + 1,
                      count - (tokens[0]?.wordsBefore ?? 0)
                    )
                  )}
                  fontSize={fontSize}
                  onLineLayout={onLineLayout}
                  onLineRows={onLineRows}
                />
              )
            )}
          </Pressable>
        </Direction>
      </ScrollView>
      <ReciteControls progress={progress} dispatch={dispatch} voice={voice} />
    </View>
  );
};
