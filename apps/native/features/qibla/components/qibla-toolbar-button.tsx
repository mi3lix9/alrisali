import "../i18n";
import { router } from "expo-router";
import { CompassIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { HeaderButton } from "@/shared/ui/header-button";

/** Opens the Qibla compass from a tab's header. */
export const QiblaToolbarButton = () => {
  const { t } = useTranslation("qibla");
  return (
    <HeaderButton
      placement="right"
      label={t("title")}
      symbol="location.north.circle"
      icon={<CompassIcon size={22} />}
      onPress={() => router.push("/qibla")}
    />
  );
};
