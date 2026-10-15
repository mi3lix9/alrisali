import "../i18n";
import { personalProgramNameSchema } from "@alrisali/domain/programs";
import type { Act, PersonalProgram } from "@alrisali/domain/programs";
import { captureException } from "@sentry/react-native";
import { randomUUID } from "expo-crypto";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Card, Input, Spinner, Text } from "panelui-native";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { ActEditorSheet } from "../components/act-editor-sheet";
import { ActRow } from "../components/act-row";
import { OfficialActPickerSheet } from "../components/official-act-picker-sheet";
import {
  usePersonalProgram,
  useSavePersonalProgram,
} from "../data/personal-programs";
import { useExplainRefusal } from "../hooks/use-explain-refusal";

const ICON_SIZE = 18;

/** Swaps the Act at `index` with its neighbour `by` places away. */
const move = (acts: readonly Act[], index: number, by: -1 | 1): Act[] => {
  const next = [...acts];
  const [act] = next.splice(index, 1);
  if (act) {
    next.splice(index + by, 0, act);
  }
  return next;
};

const Builder = ({ program }: { program: PersonalProgram | null }) => {
  const { t } = useTranslation("programs");
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [acts, setActs] = useState<readonly Act[]>(program?.acts ?? []);
  const [editing, setEditing] = useState<{ act: Act | null } | null>(null);
  const [picking, setPicking] = useState(false);
  const [problem, setProblem] = useState<"name" | "failed" | null>(null);
  const { mutateAsync: save, isPending } = useSavePersonalProgram();
  const explainRefusal = useExplainRefusal();

  const putAct = (act: Act) =>
    setActs((previous) =>
      previous.some(({ id }) => id === act.id)
        ? previous.map((each) => (each.id === act.id ? act : each))
        : [...previous, act]
    );

  const submit = async () => {
    if (!personalProgramNameSchema.safeParse(name).success) {
      setProblem("name");
      return;
    }
    setProblem(null);
    try {
      const saved = await save({
        program: {
          id: program?.id ?? randomUUID(),
          name,
          description,
          acts: [...acts],
        },
        isNew: program === null,
      });
      const leave = () =>
        program
          ? router.back()
          : router.replace({
              pathname: "/worship/programs/personal/[id]",
              params: { id: saved.program.id },
            });
      if (saved.refusal) {
        explainRefusal(saved.refusal, leave);
      } else {
        leave();
      }
    } catch (error) {
      captureException(error);
      setProblem("failed");
    }
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: program ? t("builder.editTitle") : t("builder.newTitle"),
          headerLargeTitle: false,
        }}
      />
      <Input
        testID="programs-builder-name"
        label={t("builder.name")}
        placeholder={t("builder.namePlaceholder")}
        value={name}
        onChangeText={setName}
        autoComplete="off"
        isRequired
        {...(problem === "name"
          ? { errorMessage: t("builder.invalidName") }
          : {})}
      />
      <Input
        label={t("builder.description")}
        placeholder={t("builder.descriptionPlaceholder")}
        value={description}
        onChangeText={setDescription}
        autoComplete="off"
        multiline
      />

      <Card>
        <Card.Header>
          <Card.Title>{t("builder.acts")}</Card.Title>
          <Card.Description>
            {t("acts", { count: acts.length })}
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          {acts.length === 0 ? <Text muted>{t("builder.noActs")}</Text> : null}
          {acts.map((act, index) => {
            const label = act.name[launchLanguage];
            return (
              <View key={act.id} className="gap-2">
                <ActRow act={act} onOpen={() => setEditing({ act })} />
                <View className="flex-row gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    accessibilityLabel={t("builder.editAct", { act: label })}
                    onPress={() => setEditing({ act })}
                  >
                    <PencilIcon size={ICON_SIZE} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    accessibilityLabel={t("builder.moveUp", { act: label })}
                    onPress={() => setActs(move(acts, index, -1))}
                  >
                    <ArrowUpIcon size={ICON_SIZE} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === acts.length - 1}
                    accessibilityLabel={t("builder.moveDown", { act: label })}
                    onPress={() => setActs(move(acts, index, 1))}
                  >
                    <ArrowDownIcon size={ICON_SIZE} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    accessibilityLabel={t("builder.removeAct", { act: label })}
                    onPress={() =>
                      setActs(acts.filter(({ id }) => id !== act.id))
                    }
                  >
                    <TrashIcon size={ICON_SIZE} />
                  </Button>
                </View>
              </View>
            );
          })}
        </Card.Content>
        <Card.Footer className="flex-row flex-wrap gap-2">
          <Button
            variant="outline"
            startContent={<PlusIcon size={ICON_SIZE} />}
            onPress={() => setEditing({ act: null })}
          >
            {t("builder.writeAct")}
          </Button>
          <Button variant="outline" onPress={() => setPicking(true)}>
            {t("builder.addFromOfficial")}
          </Button>
        </Card.Footer>
      </Card>

      {problem === "failed" ? (
        <Text className="text-destructive" accessibilityLiveRegion="polite">
          {t("builder.failed")}
        </Text>
      ) : null}
      <Button
        testID="programs-builder-submit"
        onPress={submit}
        loading={isPending}
      >
        {program ? t("builder.save") : t("builder.create")}
      </Button>

      <ActEditorSheet
        editing={editing}
        onSave={putAct}
        onClose={() => setEditing(null)}
      />
      <OfficialActPickerSheet
        open={picking}
        onAdd={putAct}
        onClose={() => setPicking(false)}
      />
    </Screen>
  );
};

/**
 * Builds a Personal Program from Acts the Believer writes or copies from the
 * Official Programs; with an `id`, edits that Program.
 */
export const ProgramBuilderScreen = () => {
  const { t } = useTranslation("programs");
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = usePersonalProgram(id ?? "");

  if (!id) {
    return <Builder program={null} />;
  }
  if (existing.isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }
  if (!existing.data) {
    return (
      <Screen>
        <Text muted>{t("personal.notFound")}</Text>
      </Screen>
    );
  }
  return <Builder key={id} program={existing.data} />;
};
