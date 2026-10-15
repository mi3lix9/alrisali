import "../i18n";
import type { Act } from "@alrisali/domain/programs";
import { Badge, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { useDescribe } from "../hooks/use-describe";

/** An Act in a Program's list: its name, type and timing; tap to open it. */
export const ActRow = ({ act, onOpen }: { act: Act; onOpen: () => void }) => {
  const { t } = useTranslation("programs");
  const describe = useDescribe();
  const details = [
    describe.timing(act),
    describe.schedule(act),
    act.detail.type === "prayer"
      ? t("rakahs", { count: act.detail.rakahs })
      : null,
  ].filter((part) => part !== null);

  return (
    <Pressable
      className="gap-1"
      accessibilityRole="button"
      accessibilityHint={t("day.openLabel", { act: act.name[launchLanguage] })}
      onPress={onOpen}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Text weight="medium">{act.name[launchLanguage]}</Text>
        {act.detail.type === "regular" ? null : (
          <Badge size="sm" variant="info">
            {t(`types.${act.detail.type}`)}
          </Badge>
        )}
      </View>
      <Text muted size="sm">
        {details.join(" · ")}
      </Text>
    </Pressable>
  );
};
