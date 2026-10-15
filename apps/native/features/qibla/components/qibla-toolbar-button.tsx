import "../i18n";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

// SF Symbols exist only on iOS; elsewhere the button shows its label.
const qiblaIcon =
  Platform.OS === "ios" ? ({ icon: "location.north.circle" } as const) : {};

/** Opens the Qibla compass from a tab's header. */
export const QiblaToolbarButton = () => {
  const { t } = useTranslation("qibla");
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        {...qiblaIcon}
        onPress={() => router.push("/qibla")}
      >
        {t("title")}
      </Stack.Toolbar.Button>
    </Stack.Toolbar>
  );
};
