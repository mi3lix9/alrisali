import "../i18n";
import {
  editAct,
  personalProgramNameSchema,
  SALAH_TIMINGS,
  writtenAct,
} from "@alrisali/domain/programs";
import type { Act, ActTiming, SalahTiming } from "@alrisali/domain/programs";
import { SALAH } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";
import { randomUUID } from "expo-crypto";
import {
  BottomSheet,
  Button,
  DatePicker,
  Input,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { formatGregorianDate } from "@/shared/lib/hijri-calendar";
import { launchLanguage } from "@/shared/lib/preferences";
import { useToday } from "@/shared/lib/today";

const KINDS = ["daily", "weekdays", "once"] as const;
type Kind = (typeof KINDS)[number];

// Saturday first, as the week runs where the app is mostly used.
const WEEKDAYS = [6, 7, 1, 2, 3, 4, 5] as const;
// 2024-01-01 was a Monday, Temporal's weekday 1.
const A_MONDAY = Temporal.PlainDate.from("2024-01-01");

const TIMINGS = ["general", ...SALAH_TIMINGS] as const;
type Timing = "general" | SalahTiming;

type FormError = "name" | "days" | null;

const toDate = (date: Temporal.PlainDate): Date =>
  new Date(date.year, date.month - 1, date.day);

const fromDate = (date: Date): Temporal.PlainDate =>
  Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

/** What the form starts with: the Act's values, or a daily general Act. */
const startingValues = (act: Act | null) => {
  const schedule = act?.schedule ?? { kind: "daily" as const };
  return {
    name: act?.name[launchLanguage] ?? "",
    kind: schedule.kind,
    weekdays: schedule.kind === "weekdays" ? schedule.weekdays : [],
    // null follows today until the Believer picks a date.
    date:
      schedule.kind === "once" ? Temporal.PlainDate.from(schedule.date) : null,
    timing: act?.salah?.timing ?? ("general" as const),
    salah: act?.salah?.salah ?? ("fajr" as const),
  };
};

/** The form, mounted afresh each time the sheet opens. */
const ActForm = ({
  act,
  onSave,
  onCancel,
}: {
  /** The Act to edit; null writes a new one. */
  act: Act | null;
  onSave: (act: Act) => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation("programs");
  const today = useToday();
  const start = startingValues(act);
  const [name, setName] = useState(start.name);
  const [kind, setKind] = useState<Kind>(start.kind);
  const [weekdays, setWeekdays] = useState<readonly number[]>(start.weekdays);
  const [pickedDate, setPickedDate] = useState<Temporal.PlainDate | null>(
    start.date
  );
  const [timing, setTiming] = useState<Timing>(start.timing);
  const [salah, setSalah] = useState<Salah>(start.salah);
  const [problem, setProblem] = useState<FormError>(null);
  const date = pickedDate ?? today;

  const save = () => {
    if (!personalProgramNameSchema.safeParse(name).success) {
      setProblem("name");
      return;
    }
    if (kind === "weekdays" && weekdays.length === 0) {
      setProblem("days");
      return;
    }
    let schedule: ActTiming["schedule"] = { kind: "daily" };
    if (kind === "weekdays") {
      schedule = { kind, weekdays: [...weekdays] };
    } else if (kind === "once") {
      schedule = { kind, date: date.toString() };
    }
    const when: ActTiming = {
      schedule,
      salah: timing === "general" ? null : { salah, timing },
    };
    onSave(
      act
        ? editAct(act, {
            ...when,
            // Unchanged, an Official Act keeps its name in both languages.
            ...(name.trim() === start.name ? {} : { name }),
          })
        : writtenAct({ id: randomUUID(), name, ...when })
    );
  };

  return (
    <>
      <BottomSheet.Header
        title={act ? t("actForm.editTitle") : t("actForm.newTitle")}
      />
      <BottomSheet.Body>
        <View className="gap-5 pb-4">
          <Input
            label={t("actForm.name")}
            placeholder={t("actForm.namePlaceholder")}
            value={name}
            onChangeText={setName}
            autoComplete="off"
            isRequired
            {...(problem === "name"
              ? { errorMessage: t("actForm.invalidName") }
              : {})}
          />
          <View className="gap-2">
            <Text weight="medium">{t("actForm.repeat")}</Text>
            <ToggleButtonGroup
              selectionMode="single"
              size="sm"
              accessibilityLabel={t("actForm.repeat")}
              value={[kind]}
              onValueChange={([next]) => {
                const selected = KINDS.find((option) => option === next);
                if (selected) {
                  setKind(selected);
                }
              }}
            >
              {KINDS.map((option) => (
                <ToggleButton key={option} id={option}>
                  {t(`actForm.kinds.${option}`)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </View>
          {kind === "weekdays" ? (
            <View className="gap-2">
              <Text weight="medium">{t("actForm.days")}</Text>
              <ToggleButtonGroup
                selectionMode="multiple"
                size="sm"
                className="flex-wrap"
                accessibilityLabel={t("actForm.days")}
                value={weekdays.map(String)}
                onValueChange={(next) =>
                  setWeekdays(
                    WEEKDAYS.filter((weekday) => next.includes(String(weekday)))
                  )
                }
              >
                {WEEKDAYS.map((weekday) => (
                  <ToggleButton key={weekday} id={String(weekday)}>
                    {formatGregorianDate(A_MONDAY.add({ days: weekday - 1 }), {
                      weekday: "short",
                    })}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {problem === "days" ? (
                <Text className="text-destructive">
                  {t("actForm.invalidDays")}
                </Text>
              ) : null}
            </View>
          ) : null}
          {kind === "once" ? (
            <View className="gap-2">
              <Text weight="medium">{t("actForm.date")}</Text>
              <DatePicker
                selected={toDate(date)}
                onSelect={(selected) => {
                  if (selected) {
                    setPickedDate(fromDate(selected));
                  }
                }}
                locale={launchLanguage}
              />
            </View>
          ) : null}
          <View className="gap-2">
            <Text weight="medium">{t("actForm.timing")}</Text>
            <ToggleButtonGroup
              selectionMode="single"
              size="sm"
              accessibilityLabel={t("actForm.timing")}
              value={[timing]}
              onValueChange={([next]) => {
                const selected = TIMINGS.find((option) => option === next);
                if (selected) {
                  setTiming(selected);
                }
              }}
            >
              {TIMINGS.map((option) => (
                <ToggleButton key={option} id={option}>
                  {t(`actForm.${option}`)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </View>
          {timing === "general" ? null : (
            <View className="gap-2">
              <Text weight="medium">{t("actForm.salah")}</Text>
              <ToggleButtonGroup
                selectionMode="single"
                size="sm"
                className="flex-wrap"
                accessibilityLabel={t("actForm.salah")}
                value={[salah]}
                onValueChange={([next]) => {
                  const selected = SALAH.find((option) => option === next);
                  if (selected) {
                    setSalah(selected);
                  }
                }}
              >
                {SALAH.map((option) => (
                  <ToggleButton key={option} id={option}>
                    {t(`salahNames.${option}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </View>
          )}
        </View>
      </BottomSheet.Body>
      <BottomSheet.Footer className="gap-2">
        <Button onPress={save}>{t("actForm.save")}</Button>
        <Button variant="ghost" onPress={onCancel}>
          {t("actForm.cancel")}
        </Button>
      </BottomSheet.Footer>
    </>
  );
};

/**
 * Writes a plain Act for a Personal Program, or changes an Act's name and
 * when it is done (a copied dua or prayer is kept).
 */
export const ActEditorSheet = ({
  editing,
  onSave,
  onClose,
}: {
  /** Open with the Act to edit, or `{ act: null }` for a new one; null is closed. */
  editing: { act: Act | null } | null;
  onSave: (act: Act) => void;
  onClose: () => void;
}) => (
  <BottomSheet
    open={editing !== null}
    onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}
  >
    <BottomSheet.Content>
      {editing ? (
        <ActForm
          act={editing.act}
          onSave={(act) => {
            onSave(act);
            onClose();
          }}
          onCancel={onClose}
        />
      ) : null}
    </BottomSheet.Content>
  </BottomSheet>
);
