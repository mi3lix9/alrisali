import "../i18n";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";

/** The Quran's entry in the Library: opens Page Mode at page 1. */
export const QuranLibraryCard = () => {
  const { t } = useTranslation("quran");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>{t("library.description")}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          onPress={() =>
            router.push({ pathname: "/quran", params: { page: "1" } })
          }
        >
          {t("library.open")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
