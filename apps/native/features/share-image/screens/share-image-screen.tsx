import "../i18n";
import {
  DEFAULT_SHARE_IMAGE_OPTIONS,
  SHARE_IMAGE_BACKGROUNDS,
  SHARE_IMAGE_OPENERS,
  SHARE_IMAGE_SIZES,
  shareImageFileName,
  shareImageSize,
} from "@alrisali/domain/share-image";
import type {
  ShareImageBackgroundId,
  ShareImageOpener,
  ShareImageOptions,
  ShareImageSizeId,
} from "@alrisali/domain/share-image";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Item,
  Spinner,
  Switch,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, useWindowDimensions, View } from "react-native";

import { useCaptureShare } from "@/shared/lib/capture-share";
import { Screen } from "@/shared/ui/screen";

import { contentFits, ShareCanvas } from "../components/share-canvas";
import type { ShareCanvasContent } from "../components/share-canvas";
import { useShareFonts } from "../hooks/use-share-fonts";
import { useShareSource } from "../hooks/use-share-source";
import type { ShareSource } from "../hooks/use-share-source";
import { readShareRequest } from "../utils/share-route";

const SCREEN_PADDING = 32;
const MAX_PREVIEW_HEIGHT_SHARE = 0.55;

const isSize = (id: string): id is ShareImageSizeId =>
  SHARE_IMAGE_SIZES.some((size) => size.id === id);
const isOpener = (id: string): id is ShareImageOpener =>
  SHARE_IMAGE_OPENERS.some((opener) => opener === id);

const Swatch = ({
  id,
  color,
  label,
  selected,
  onPress,
}: {
  id: ShareImageBackgroundId;
  color: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    testID={`share-image-background-${id}`}
    accessibilityRole="radio"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    onPress={onPress}
    className={`size-9 rounded-full border ${selected ? "border-primary border-2" : "border-border"}`}
    style={{ backgroundColor: color }}
  />
);

const contentOf = (
  source: ShareSource,
  section: number
): ShareCanvasContent => {
  if (source.kind === "supplication") {
    return {
      kind: "supplication",
      text: source.sections[section] ?? "",
      reference: source.title,
    };
  }
  if (source.kind === "ayah") {
    return { kind: "ayah", text: source.text, reference: source.reference };
  }
  return { kind: "times", times: source.times };
};

/**
 * One composer for an ayah, a Supplication excerpt or today's Prayer Times:
 * a preview in the chosen size and flat colour, the options that change it,
 * and Share, which sends the image through the system share sheet.
 */
export const ShareImageScreen = () => {
  const { t } = useTranslation("share-image");
  const params = useLocalSearchParams();
  const source = useShareSource(readShareRequest(params));
  const fontsReady = useShareFonts();
  const { width, height } = useWindowDimensions();
  const { canvasRef, share, sharing } = useCaptureShare();
  const [options, setOptions] = useState<ShareImageOptions>(
    DEFAULT_SHARE_IMAGE_OPTIONS
  );
  const [section, setSection] = useState(0);
  const update = (change: Partial<ShareImageOptions>) =>
    setOptions((current) => ({ ...current, ...change }));

  if (source === undefined || !fontsReady) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("title") }} />
        <Spinner />
      </Screen>
    );
  }
  if (source === null) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("title") }} />
        <Text muted>{t("unavailable")}</Text>
      </Screen>
    );
  }

  const size = shareImageSize(options.size);
  const content = contentOf(source, section);
  const fits = contentFits(content, options);
  const scale = Math.min(
    (width - SCREEN_PADDING * 2) / size.width,
    (height * MAX_PREVIEW_HEIGHT_SHARE) / size.height
  );
  const sectionCount =
    source.kind === "supplication" ? source.sections.length : 0;

  const onShare = async () => {
    const result = await share({
      width: size.width,
      height: size.height,
      fileName: shareImageFileName(source.subject, options.size),
    });
    if (result === "failed") {
      toast.show({ variant: "destructive", label: t("failed") });
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("title") }} />
      <View className="items-center">
        <ShareCanvas
          content={content}
          options={options}
          scale={scale}
          canvasRef={canvasRef}
        />
      </View>
      {fits ? null : (
        <Text
          testID="share-image-too-long"
          size="sm"
          className="text-destructive"
        >
          {t("tooLong")}
        </Text>
      )}
      <Card>
        <Card.Content className="gap-4">
          <Text size="sm" muted>
            {t("size.label")}
          </Text>
          <ToggleButtonGroup
            testID="share-image-size"
            selectionMode="single"
            size="sm"
            accessibilityLabel={t("size.label")}
            value={[options.size]}
            onValueChange={([next]) => {
              if (next && isSize(next)) {
                update({ size: next });
              }
            }}
          >
            {SHARE_IMAGE_SIZES.map((item) => (
              <ToggleButton key={item.id} id={item.id}>
                {t(`size.${item.id}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Text size="sm" muted>
            {t("background.label")}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {SHARE_IMAGE_BACKGROUNDS.map((item) => (
              <Swatch
                key={item.id}
                id={item.id}
                color={item.background}
                label={t(`background.${item.id}`)}
                selected={options.background === item.id}
                onPress={() => update({ background: item.id })}
              />
            ))}
          </View>
          {source.kind === "ayah" ? (
            <>
              <Text size="sm" muted>
                {t("opener.label")}
              </Text>
              <ToggleButtonGroup
                testID="share-image-opener-group"
                selectionMode="single"
                size="sm"
                accessibilityLabel={t("opener.label")}
                value={[options.opener]}
                onValueChange={([next]) => {
                  if (next && isOpener(next)) {
                    update({ opener: next });
                  }
                }}
              >
                {SHARE_IMAGE_OPENERS.map((opener) => (
                  <ToggleButton key={opener} id={opener}>
                    {t(`opener.${opener}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </>
          ) : null}
          {source.kind === "supplication" ? (
            <View className="flex-row items-center justify-between">
              <Button
                testID="share-image-section-previous"
                variant="ghost"
                size="sm"
                accessibilityLabel={t("section.previous")}
                disabled={section === 0}
                onPress={() => setSection(section - 1)}
              >
                ‹
              </Button>
              <Text>
                {t("section.position", {
                  number: section + 1,
                  count: sectionCount,
                })}
              </Text>
              <Button
                testID="share-image-section-next"
                variant="ghost"
                size="sm"
                accessibilityLabel={t("section.next")}
                disabled={section >= sectionCount - 1}
                onPress={() => setSection(section + 1)}
              >
                ›
              </Button>
            </View>
          ) : null}
        </Card.Content>
      </Card>
      <Item variant="outline">
        <Item.Content>
          <Item.Title>{t("attribution.label")}</Item.Title>
          <Item.Description>{t("attribution.description")}</Item.Description>
        </Item.Content>
        <Item.Actions>
          <Switch
            label={t("attribution.label")}
            value={options.attribution}
            onValueChange={(attribution) => update({ attribution })}
          />
        </Item.Actions>
      </Item>
      <Button
        testID="share-image-share"
        disabled={sharing || !fits}
        onPress={onShare}
      >
        {sharing ? t("sharing") : t("share")}
      </Button>
    </Screen>
  );
};
