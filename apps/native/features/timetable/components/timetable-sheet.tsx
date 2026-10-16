import type { RefObject } from "react";
import { ScrollView, Text, View } from "react-native";

import type { CanvasHandle } from "@/shared/lib/capture-share";

import {
  SHEET_COLORS,
  SHEET_HEADER_HEIGHT,
  SHEET_PADDING,
  SHEET_ROW_HEIGHT,
  SHEET_TITLE_HEIGHT,
  SHEET_WIDTH,
  sheetHeight,
} from "../utils/sheet";
import type { Sheet, SheetMark } from "../utils/sheet";

const MARK_BACKGROUNDS: Record<SheetMark, string> = {
  today: SHEET_COLORS.today,
  friday: SHEET_COLORS.friday,
  qadr: SHEET_COLORS.qadr,
};

const HEADER_SIZE = 12;
const CELL_SIZE = 12;
const TAG_SIZE = 9;

/**
 * A sheet drawn at its own fixed width, on a light page whatever the app's
 * theme. This view is what the image captures, so what the Believer sees is
 * what is shared; it scrolls sideways when the screen is narrower. The
 * first `wide` columns (the dates) are given more room than the times.
 */
export const TimetableSheet = ({
  sheet,
  wide,
  canvasRef,
}: {
  sheet: Sheet;
  wide: number;
  canvasRef: RefObject<CanvasHandle | null>;
}) => {
  const flexOf = (column: number) => (column < wide ? 1.6 : 1);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View
        ref={canvasRef}
        collapsable={false}
        testID="timetable-sheet"
        style={{
          width: SHEET_WIDTH,
          height: sheetHeight(sheet.rows.length),
          padding: SHEET_PADDING,
          backgroundColor: SHEET_COLORS.page,
        }}
      >
        <View style={{ height: SHEET_TITLE_HEIGHT, justifyContent: "center" }}>
          <Text
            style={{
              color: SHEET_COLORS.accent,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {sheet.title}
          </Text>
          <Text style={{ color: SHEET_COLORS.muted, fontSize: 12 }}>
            {sheet.subtitle}
          </Text>
        </View>
        <View
          style={{
            height: SHEET_HEADER_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: SHEET_COLORS.header,
          }}
        >
          {sheet.headers.map((header, column) => (
            <Text
              key={header}
              style={{
                flex: flexOf(column),
                textAlign: "center",
                color: SHEET_COLORS.text,
                fontSize: HEADER_SIZE,
                fontWeight: "600",
              }}
            >
              {header}
            </Text>
          ))}
        </View>
        {sheet.rows.map(({ cells, mark, tag }, index) => (
          <View
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
            style={{
              height: SHEET_ROW_HEIGHT,
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: SHEET_COLORS.line,
              backgroundColor: mark
                ? MARK_BACKGROUNDS[mark]
                : SHEET_COLORS.page,
            }}
          >
            {cells.map((cell, column) => (
              <Text
                // oxlint-disable-next-line react/no-array-index-key
                key={column}
                style={{
                  flex: flexOf(column),
                  textAlign: "center",
                  color: SHEET_COLORS.text,
                  fontSize: CELL_SIZE,
                  fontWeight: mark === "today" ? "700" : "400",
                }}
              >
                {cell}
                {column === 0 && tag ? (
                  <Text
                    style={{ color: SHEET_COLORS.accent, fontSize: TAG_SIZE }}
                  >
                    {` ${tag}`}
                  </Text>
                ) : null}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
