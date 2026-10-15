import { router } from "expo-router";
import { Card, Item } from "panelui-native";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

const PAGES = [
  { key: "sources", href: "/settings/sources" },
  { key: "privacy", href: "/settings/privacy" },
  { key: "terms", href: "/settings/terms" },
] as const;

/** Links to Sources & Credits, the Privacy Policy and the Terms of Service. */
export const AboutCard = () => {
  const { t } = useTranslation("settings");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("about.title")}</Card.Title>
      </Card.Header>
      <Card.Content>
        <Item.Group>
          {PAGES.map(({ key, href }, index) => (
            <Fragment key={key}>
              {index > 0 && <Item.Separator />}
              <Item
                size="sm"
                accessibilityRole="link"
                onPress={() => router.push(href)}
              >
                <Item.Content>
                  <Item.Title>{t(`about.${key}`)}</Item.Title>
                </Item.Content>
              </Item>
            </Fragment>
          ))}
        </Item.Group>
      </Card.Content>
    </Card>
  );
};
