import "../i18n";
import { router } from "expo-router";
import { Button } from "panelui-native";
import { CalendarIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

/** An icon button that opens the Hijri calendar, for another screen's toolbar. */
export const HijriCalendarButton = () => {
  const { t } = useTranslation("calendar");
  return (
    <Button
      testID="hijri-calendar-button"
      variant="ghost"
      size="icon"
      accessibilityLabel={t("title")}
      onPress={() => router.push("/calendar")}
    >
      <CalendarIcon size={22} />
    </Button>
  );
};
