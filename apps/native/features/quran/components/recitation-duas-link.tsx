import "../i18n/duas";
import type { RecitationDuaMoment } from "@alrisali/domain/quran";
import { router } from "expo-router";
import { Button } from "panelui-native";
import { HeartIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

/** Opens the recitation duas at one moment: before, after, or on completing the Quran. */
export const RecitationDuasLink = ({
  moment,
}: {
  moment: RecitationDuaMoment;
}) => {
  const { t } = useTranslation("quranDuas");
  return (
    <Button
      testID={`recitation-duas-${moment}`}
      variant="secondary"
      startContent={<HeartIcon size={18} />}
      onPress={() =>
        router.push({ pathname: "/recitation-duas", params: { moment } })
      }
    >
      {moment === "completion"
        ? t("recitation.afterKhatmah")
        : t(`recitation.moments.${moment}`)}
    </Button>
  );
};
