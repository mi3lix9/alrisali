import { useRouter } from "expo-router";
import { Button } from "panelui-native";
import { XIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

/**
 * Closes the modal it heads. A sheet closes with a swipe down, which VoiceOver
 * cannot make, so every modal shows this button too.
 */
export const ModalCloseButton = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      accessibilityLabel={t("controls.close")}
      // From a modal stack's first screen, back closes the modal itself.
      onPress={() => router.back()}
    >
      <XIcon size={20} />
    </Button>
  );
};
