import "../i18n";
import { router } from "expo-router";
import { Button } from "panelui-native";
import { CalendarIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

/** A button that opens the monthly timetable, for the Prayer tab. */
export const MonthlyTimetableLink = () => {
  const { t } = useTranslation("timetable");
  return (
    <Button
      testID="timetable-open"
      variant="secondary"
      onPress={() => router.push("/timetable")}
    >
      <CalendarIcon size={18} />
      {t("link")}
    </Button>
  );
};
