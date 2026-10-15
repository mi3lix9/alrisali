import "../i18n";
import type { OpenTasbih } from "@alrisali/db-user/tasbih";
import { openTasbihDetailsSchema } from "@alrisali/domain/tasbih";
import { captureException } from "@sentry/react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Input, Spinner, Text, Textarea } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { Screen } from "@/shared/ui/screen";

import {
  createOpenTasbih,
  editOpenTasbih,
  removeOpenTasbih,
  useSavedOpenTasbih,
} from "../data/tasbih";
import { parseTarget } from "../utils/parse-target";

type FormError = "name" | "target" | "failed" | null;

const firstInvalidField = (path: PropertyKey[]): FormError =>
  path[0] === "name" ? "name" : "target";

const OpenTasbihForm = ({ saved }: { saved: OpenTasbih | null }) => {
  const { t } = useTranslation("tasbih");
  const [name, setName] = useState(saved?.name ?? "");
  const [target, setTarget] = useState(
    saved?.target ? String(saved.target) : ""
  );
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [problem, setProblem] = useState<FormError>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const details = openTasbihDetailsSchema.safeParse({
      name,
      target: parseTarget(target),
      notes,
    });
    if (!details.success) {
      setProblem(firstInvalidField(details.error.issues[0]?.path ?? []));
      return;
    }
    setProblem(null);
    setSaving(true);
    try {
      if (saved) {
        await editOpenTasbih(saved.id, details.data);
        router.back();
      } else {
        const created = await createOpenTasbih(details.data);
        router.replace({
          pathname: "/tasbih/[id]",
          params: { id: created.id },
        });
      }
    } catch (error) {
      captureException(error);
      setProblem("failed");
      setSaving(false);
    }
  };

  const confirmDelete = (tasbih: OpenTasbih) =>
    Alert.alert(
      t("form.delete.title", { name: tasbih.name }),
      t("form.delete.message"),
      [
        { text: t("reset.cancel"), style: "cancel" },
        {
          text: t("form.delete.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await removeOpenTasbih(tasbih.id);
              router.dismissTo("/tasbih");
            } catch (error) {
              captureException(error);
              setProblem("failed");
            }
          },
        },
      ]
    );

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: saved ? t("form.editTitle") : t("form.createTitle"),
          headerLargeTitle: false,
        }}
      />
      <Input
        label={t("form.name")}
        placeholder={t("form.namePlaceholder")}
        value={name}
        onChangeText={setName}
        autoComplete="off"
        isRequired
        {...(problem === "name" ? { errorMessage: t("form.invalidName") } : {})}
      />
      <Input
        label={t("form.target")}
        description={t("form.targetDescription")}
        value={target}
        onChangeText={setTarget}
        keyboardType="number-pad"
        {...(problem === "target"
          ? { errorMessage: t("form.invalidTarget") }
          : {})}
      />
      <Textarea
        label={t("form.notes")}
        description={t("form.notesDescription")}
        value={notes}
        onChangeText={setNotes}
        autoGrow
        rows={3}
      />
      {problem === "failed" ? (
        <Text className="text-destructive" accessibilityLiveRegion="polite">
          {t("form.failed")}
        </Text>
      ) : null}
      <Button onPress={submit} disabled={saving}>
        {saved ? t("form.save") : t("form.create")}
      </Button>
      {saved ? (
        <View className="pt-4">
          <Button variant="destructive" onPress={() => confirmDelete(saved)}>
            {t("form.delete.action")}
          </Button>
        </View>
      ) : null}
    </Screen>
  );
};

/** Creates an Open Tasbih, or edits (and deletes) the one in `?id=`. */
export const OpenTasbihFormScreen = () => {
  const { t } = useTranslation("tasbih");
  const { id } = useLocalSearchParams<{ id?: string }>();
  const saved = useSavedOpenTasbih(id);

  if (!id) {
    return <OpenTasbihForm saved={null} />;
  }
  if (saved.data === null) {
    return (
      <Screen>
        <Text muted>{t("open.notFound")}</Text>
      </Screen>
    );
  }
  if (saved.data === undefined) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }
  return <OpenTasbihForm key={id} saved={saved.data} />;
};
