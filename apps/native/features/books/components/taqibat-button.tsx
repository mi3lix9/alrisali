import "../i18n";
import { taqibatFor } from "@alrisali/domain/books";
import type { Salah } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Button } from "panelui-native";
import { useTranslation } from "react-i18next";

interface TaqibatButtonProps {
  salah: Salah;
}

/**
 * Opens this Salah's taqibat in the Supplication reader; renders nothing
 * while no taqibat for it is bundled.
 */
export const TaqibatButton = ({ salah }: TaqibatButtonProps) => {
  const { t } = useTranslation("books");
  const taqibat = taqibatFor(salah);
  if (!taqibat) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      testID={`books-taqibat-${salah}`}
      onPress={() =>
        router.push({
          pathname: "/library/supplication/[id]",
          params: { id: taqibat.id },
        })
      }
    >
      {t("taqibat")}
    </Button>
  );
};
