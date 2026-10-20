import { Button, Text } from "panelui-native";
import { BookmarkIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

/**
 * Offers to continue a Supplication at the saved section, or, once continued,
 * to start it over from the top.
 */
export const ResumeBanner = ({
  section,
  total,
  resumed,
  onResume,
  onRestart,
}: {
  /** The saved section, from 0. */
  section: number;
  total: number;
  resumed: boolean;
  onResume: () => void;
  onRestart: () => void;
}) => {
  const { t } = useTranslation("books");
  const number = formatNumber(section + 1);

  return (
    <View
      testID="books-reader-resume"
      className="bg-muted mb-2 flex-row items-center gap-3 rounded-2xl p-3"
    >
      <BookmarkIcon size={20} />
      <Text className="flex-1">
        {resumed
          ? t("reader.resume.resumed", { section: number })
          : t("reader.resume.offer", {
              section: number,
              total: formatNumber(total),
            })}
      </Text>
      <Button
        size="sm"
        variant={resumed ? "ghost" : "primary"}
        testID={resumed ? "books-reader-restart" : "books-reader-continue"}
        onPress={resumed ? onRestart : onResume}
      >
        {resumed ? t("reader.resume.restart") : t("reader.resume.go")}
      </Button>
    </View>
  );
};
