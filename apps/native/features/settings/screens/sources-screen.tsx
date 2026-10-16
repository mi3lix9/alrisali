import "../i18n";
import { CONTENT_SOURCES } from "@alrisali/content";
import { openBrowserAsync } from "expo-web-browser";
import { Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/shared/ui/screen";

import { SOFTWARE_CREDITS } from "../data/software-credits";

interface Credit {
  id:
    | (typeof CONTENT_SOURCES)[number]["id"]
    | (typeof SOFTWARE_CREDITS)[number]["id"];
  name: string;
  url: string;
  licence: string;
}

const CONTENT_CREDITS: readonly Credit[] = CONTENT_SOURCES.map(
  ({ id, name, url, licence }) => ({ id, name, url, licence: licence.name })
);

const CreditItem = ({ credit }: { credit: Credit }) => {
  const { t } = useTranslation("settings");

  return (
    <Item
      variant="outline"
      orientation="vertical"
      accessibilityRole="link"
      onPress={() => openBrowserAsync(credit.url)}
    >
      <Item.Content>
        <Item.Title>{credit.name}</Item.Title>
        <Item.Description>{t(`sources.credits.${credit.id}`)}</Item.Description>
      </Item.Content>
      {/* The licence is its own paragraph: an English licence inside an
          Arabic line wraps its second half out of reading order. */}
      <Item.Footer className="flex-col items-stretch gap-1">
        <Text size="sm" muted>
          {t("sources.licence")}
        </Text>
        <Text size="sm" muted>
          {credit.licence}
        </Text>
      </Item.Footer>
    </Item>
  );
};

/** Every source of the app's content and the software it is built with. */
export const SourcesScreen = () => {
  const { t } = useTranslation("settings");

  return (
    <Screen>
      <Text muted>{t("sources.intro")}</Text>
      <Text size="lg" weight="semibold" accessibilityRole="header">
        {t("sources.content")}
      </Text>
      {CONTENT_CREDITS.map((credit) => (
        <CreditItem key={credit.id} credit={credit} />
      ))}
      <Text size="lg" weight="semibold" accessibilityRole="header">
        {t("sources.software")}
      </Text>
      {SOFTWARE_CREDITS.map((credit) => (
        <CreditItem key={credit.id} credit={credit} />
      ))}
    </Screen>
  );
};
