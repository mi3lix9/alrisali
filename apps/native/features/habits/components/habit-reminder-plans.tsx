import "../i18n";
import type { HabitReminderPlan } from "@alrisali/domain/shared";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useHabitData } from "../data/habits";
import { habitName } from "../utils/habit-name";

/**
 * Hands the Reminders of every active Habit to `children` (undefined while
 * they load), so the root route can pass them to the Reminder scheduler.
 */
export const HabitReminderPlans = ({
  children,
}: {
  children: (plans: readonly HabitReminderPlan[] | undefined) => ReactNode;
}) => {
  const { t } = useTranslation("habits");
  const { data } = useHabitData();
  const plans = data?.habits.flatMap((habit): HabitReminderPlan[] =>
    habit.archived || habit.reminderAt === null
      ? []
      : [
          {
            habitId: habit.id,
            name: habitName(habit, t),
            schedule: habit.schedule,
            reminderAt: habit.reminderAt,
          },
        ]
  );
  return children(plans);
};
