import "../i18n";
import { router } from "expo-router";
import { Button } from "panelui-native";
import { ChevronsUpDownIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

/** An icon button that opens the date converter, for the calendar's header. */
export const DateConverterButton = () => {
  const { t } = useTranslation("calendar");
  return (
    <Button
      testID="date-converter-button"
      variant="ghost"
      size="icon"
      accessibilityLabel={t("converter.title")}
      onPress={() => router.push("/date-converter")}
    >
      <ChevronsUpDownIcon size={22} />
    </Button>
  );
};
