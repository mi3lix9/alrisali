import { khatmahReminderPlan } from "@alrisali/domain/khatmah";
import type { KhatmahReminderPlan } from "@alrisali/domain/shared";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { useToday } from "@/shared/lib/today";

import { useActiveKhatmah } from "../hooks/use-active-khatmah";

/**
 * Hands the Khatmah's daily Reminder to `children` (undefined while it loads,
 * null when there is none), so the root route can pass it to the Reminder
 * scheduler.
 */
export const KhatmahReminderPlans = ({
  children,
}: {
  children: (plan: KhatmahReminderPlan | null | undefined) => ReactNode;
}) => {
  const active = useActiveKhatmah();
  const today = useToday();
  // One plan per change of the data or the day, so the scheduler re-plans
  // only then.
  const plan = useMemo(() => {
    if (active === undefined) {
      return;
    }
    return active
      ? khatmahReminderPlan(active.khatmah, active.logs, today)
      : null;
  }, [active, today]);
  return children(plan);
};
