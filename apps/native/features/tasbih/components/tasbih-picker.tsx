import { TASBIH_AL_ZAHRA_ID } from "@alrisali/domain/tasbih";
import { router } from "expo-router";
import { Chip } from "panelui-native";
import { PlusIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { useTasbihList } from "../data/tasbih";

/**
 * Every Tasbih as a row of chips, Tasbih al-Zahra first and selected (this
 * row sits on its screen); an Open Tasbih opens its own counter, and the last
 * chip creates one.
 */
export const TasbihPicker = () => {
  const { t } = useTranslation("tasbih");
  const { data: tasbih = [] } = useTasbihList();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t("picker.label")}
      contentContainerClassName="gap-2 px-4 py-2"
      className="grow-0"
    >
      <Chip key={TASBIH_AL_ZAHRA_ID} size="lg" variant="primary" selected>
        {t("tasbihAlZahra")}
      </Chip>
      {tasbih.map((item) =>
        item.kind === "open" ? (
          <Chip
            key={item.id}
            size="lg"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: "/tasbih/[id]",
                params: { id: item.id },
              })
            }
          >
            {item.name}
          </Chip>
        ) : null
      )}
      <Chip
        size="lg"
        variant="outline"
        start={<PlusIcon size={16} />}
        onPress={() => router.push("/tasbih/new")}
      >
        {t("picker.new")}
      </Chip>
    </ScrollView>
  );
};
