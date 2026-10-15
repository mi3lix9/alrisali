import type { ReciteToken } from "@alrisali/domain/recite-along";
import { Text } from "panelui-native";
import { Fragment, memo } from "react";
import type { LayoutChangeEvent, TextLayoutEvent } from "react-native";

const LINE_HEIGHT = 2;

export interface LineRow {
  /** Character offset in the line where this row starts. */
  start: number;
  /** Row top, from the line's top. */
  y: number;
}

interface ReciteLineProps {
  index: number;
  tokens: readonly ReciteToken[];
  /**
   * The Believer's place relative to this line's first word: -1 before the
   * line, past its last word after it.
   */
  reached: number;
  fontSize: number;
  onLineLayout: (index: number, top: number) => void;
  onLineRows: (index: number, rows: LineRow[]) => void;
}

const tokenClassName = (recited: boolean, current: boolean) => {
  if (current) {
    return "bg-primary/15";
  }
  return recited ? "text-primary" : "";
};

const ReciteLineView = ({
  index,
  tokens,
  reached,
  fontSize,
  onLineLayout,
  onLineRows,
}: ReciteLineProps) => {
  const first = tokens[0]?.wordsBefore ?? 0;

  return (
    <Text
      className="pb-4"
      style={{ fontSize, lineHeight: fontSize * LINE_HEIGHT }}
      onLayout={(event: LayoutChangeEvent) =>
        onLineLayout(index, event.nativeEvent.layout.y)
      }
      onTextLayout={(event: TextLayoutEvent) => {
        let start = 0;
        const rows = event.nativeEvent.lines.map((row) => {
          const placed = { start, y: row.y };
          start += row.text.length;
          return placed;
        });
        onLineRows(index, rows);
      }}
    >
      {tokens.map((token, tokenIndex) => {
        const local = (token.wordIndex ?? token.wordsBefore) - first;
        const recited = local < reached;
        const current = token.wordIndex !== null && local === reached;
        return (
          // Tokens never reorder: their place in the line is their identity.
          // oxlint-disable-next-line react/no-array-index-key
          <Fragment key={tokenIndex}>
            {tokenIndex > 0 ? " " : null}
            <Text className={tokenClassName(recited, current)}>
              {token.text}
            </Text>
          </Fragment>
        );
      })}
    </Text>
  );
};

/** One line of the text, its recited words highlighted. */
export const ReciteLine = memo(ReciteLineView);
