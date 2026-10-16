import {
  fitShareText,
  openerText,
  SHARE_TEXT_LINE_HEIGHT,
  shareImageBackground,
  shareImageSize,
  shareTextBox,
  shareTimesRowHeight,
} from "@alrisali/domain/share-image";
import type {
  ShareImageOptions,
  ShareTimes,
} from "@alrisali/domain/share-image";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { CanvasHandle } from "../hooks/use-capture-share";
import { SHARE_QURAN_FONT } from "../hooks/use-share-fonts";

/** What the canvas shows, apart from its options. */
export type ShareCanvasContent =
  | { kind: "ayah"; text: string; reference: string }
  | { kind: "supplication"; text: string; reference: string }
  | { kind: "times"; times: ShareTimes };

interface ShareCanvasProps {
  content: ShareCanvasContent;
  options: ShareImageOptions;
  /** Preview pixels per image pixel; the saved image is captured at full size. */
  scale: number;
  canvasRef: RefObject<CanvasHandle | null>;
}

const TimesBody = ({
  times,
  options,
  ink,
  scale,
}: {
  times: ShareTimes;
  options: ShareImageOptions;
  ink: string;
  scale: number;
}) => {
  const u = (value: number) => value * scale;
  const rowHeight = shareTimesRowHeight(
    shareImageSize(options.size),
    times.rows.length,
    options
  );
  const fontSize = rowHeight * 0.5;
  return (
    <View style={{ width: "100%" }}>
      <Text
        style={{
          color: ink,
          fontSize: u(64),
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {times.title}
      </Text>
      <Text
        style={{
          color: ink,
          opacity: 0.7,
          fontSize: u(34),
          textAlign: "center",
          marginBottom: u(60),
        }}
      >
        {times.subtitle}
      </Text>
      {times.rows.map((row) => (
        <View
          key={row.label}
          style={{
            height: u(rowHeight),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: u(2),
            borderBottomColor: `${ink}24`,
          }}
        >
          <Text style={{ color: ink, fontSize: u(fontSize) }}>{row.label}</Text>
          <Text style={{ color: ink, fontSize: u(fontSize) }}>{row.time}</Text>
        </View>
      ))}
      {times.footer ? (
        <Text
          style={{
            color: ink,
            opacity: 0.6,
            fontSize: u(30),
            textAlign: "center",
            marginTop: u(30),
          }}
        >
          {times.footer}
        </Text>
      ) : null}
    </View>
  );
};

/** Whether the content's text fits the image at the size and opener chosen. */
export const contentFits = (
  content: ShareCanvasContent,
  options: ShareImageOptions
): boolean =>
  content.kind === "times" ||
  fitShareText(
    content.text,
    shareTextBox(shareImageSize(options.size), {
      opener: content.kind === "ayah" ? options.opener : "none",
      attribution: options.attribution,
    })
  ).fits;

/**
 * The image itself, drawn at `scale` of its saved size on a flat colour. The
 * Arabic runs right to left and is centred; the ayah is set in the Quran font.
 */
export const ShareCanvas = ({
  content,
  options,
  scale,
  canvasRef,
}: ShareCanvasProps) => {
  const { t } = useTranslation("share-image");
  const size = shareImageSize(options.size);
  const { background, ink } = shareImageBackground(options.background);
  const u = (value: number) => value * scale;
  const padding = u(96);
  const opener = content.kind === "ayah" ? openerText(options.opener) : null;

  const textContent = content.kind === "times" ? null : content;
  const fit = textContent
    ? fitShareText(
        textContent.text,
        shareTextBox(size, {
          opener: opener ? options.opener : "none",
          attribution: options.attribution,
        })
      )
    : null;
  const fontFamily = content.kind === "ayah" ? SHARE_QURAN_FONT : undefined;

  return (
    <View
      ref={canvasRef}
      collapsable={false}
      accessibilityLabel={t("preview")}
      testID="share-image-canvas"
      style={{
        width: u(size.width),
        height: u(size.height),
        backgroundColor: background,
        padding,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {opener ? (
          <Text
            testID="share-image-opener"
            style={{
              color: ink,
              opacity: 0.85,
              fontFamily: SHARE_QURAN_FONT,
              fontSize: u(44),
              lineHeight: u(44 * SHARE_TEXT_LINE_HEIGHT),
              writingDirection: "rtl",
              textAlign: "center",
              marginBottom: u(32),
            }}
          >
            {opener}
          </Text>
        ) : null}
        {textContent && fit ? (
          <>
            <Text
              testID="share-image-text"
              style={{
                color: ink,
                fontFamily,
                fontSize: u(fit.fontSize),
                lineHeight: u(fit.fontSize * SHARE_TEXT_LINE_HEIGHT),
                writingDirection: "rtl",
                textAlign: "center",
              }}
            >
              {textContent.text}
            </Text>
            <Text
              style={{
                color: ink,
                opacity: 0.7,
                fontSize: u(34),
                marginTop: u(40),
                textAlign: "center",
              }}
            >
              {textContent.reference}
            </Text>
          </>
        ) : null}
        {content.kind === "times" ? (
          <TimesBody
            times={content.times}
            options={options}
            ink={ink}
            scale={scale}
          />
        ) : null}
      </View>
      {options.attribution ? (
        <Text
          testID="share-image-attribution"
          style={{
            color: ink,
            opacity: 0.5,
            fontSize: u(30),
            height: u(80),
            textAlign: "center",
            textAlignVertical: "bottom",
          }}
        >
          {t("attribution.line")}
        </Text>
      ) : null}
    </View>
  );
};
