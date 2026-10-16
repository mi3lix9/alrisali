import { qadaReminderPlan } from "@alrisali/domain/qada";
import type { QadaReminderPlan } from "@alrisali/domain/shared";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { useQadaData } from "../data/qada";

/**
 * Hands the Qada Reminder to `children` (undefined while it loads, null when
 * it is off or nothing is left), so the root route can pass it to the
 * Reminder scheduler.
 */
export const QadaReminderPlans = ({
  children,
}: {
  children: (plan: QadaReminderPlan | null | undefined) => ReactNode;
}) => {
  const { data } = useQadaData();
  // One plan per change of the data, so the scheduler re-plans only then.
  const plan = useMemo(() => {
    if (!data) {
      return;
    }
    return data.plan ? qadaReminderPlan(data.plan, data.logs) : null;
  }, [data]);
  return children(plan);
};
