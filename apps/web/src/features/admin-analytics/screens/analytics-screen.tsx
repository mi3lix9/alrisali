import type { AgeBand } from "@alrisali/domain/analytics";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { DailyActiveUsers } from "../components/daily-active-users";
import { Bars, Report, Stat } from "../components/report-parts";

const WINDOWS = [7, 30, 90] as const;

const AGE_LABELS: Record<AgeBand, string> = {
  "under-18": "Under 18",
  "18-25": "18–25",
  "26-35": "26–35",
  "36-50": "36–50",
  "over-50": "Over 50",
};

const Summary = () => {
  const summary = useQuery(orpc.analytics.summary.queryOptions());
  if (summary.isPending) {
    return <Loader />;
  }
  if (summary.isError) {
    return (
      <p className="text-destructive">
        Could not load usage analytics: {summary.error.message}
      </p>
    );
  }
  const { data } = summary;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Installations" value={data.installs} />
      <Stat label="Signed-in Believers" value={data.believers} />
      <Stat label="Active today" value={data.activeToday} />
      <Stat label="Active, last 7 days" value={data.activeWeek} />
      <Stat label="Active, last 30 days" value={data.activeMonth} />
      <Stat label="Events" value={data.events} />
      <Stat label="Events today" value={data.eventsToday} />
    </div>
  );
};

const usageRows = (
  rows: readonly {
    name: string;
    count: number;
    installs: number;
    percentage: number;
  }[]
) =>
  rows.map((row) => ({
    label: row.name,
    value: row.count,
    percentage: row.percentage,
    detail: `${row.installs.toLocaleString("en")} installations`,
  }));

const shareRows = (
  rows: readonly { name: string; count: number; percentage: number }[]
) =>
  rows.map((row) => ({
    label: row.name,
    value: row.count,
    percentage: row.percentage,
  }));

interface WindowProps {
  days: number;
}

const PopularSections = ({ days }: WindowProps) => {
  const { data } = useQuery(
    orpc.analytics.popularSections.queryOptions({ input: { days } })
  );
  return (
    <Report
      title="Popular sections"
      description="The most viewed screens."
      empty={data?.length === 0}
    >
      <Bars rows={usageRows(data ?? [])} />
    </Report>
  );
};

const FeatureUsage = ({ days }: WindowProps) => {
  const { data } = useQuery(
    orpc.analytics.featureUsage.queryOptions({ input: { days } })
  );
  return (
    <Report
      title="Feature usage"
      description="Prayer Log entries, Dhikr Sessions and other features used."
      empty={data?.length === 0}
    >
      <Bars rows={usageRows(data ?? [])} />
    </Report>
  );
};

const Retention = ({ days }: WindowProps) => {
  const { data } = useQuery(
    orpc.analytics.retention.queryOptions({ input: { cohortDays: days } })
  );
  return (
    <Report
      title="Retention"
      description={`Of the ${data?.cohort ?? 0} installations first seen in this period, those active again after 1, 7 and 30 days (counted once that long has passed).`}
      empty={data?.cohort === 0}
    >
      <Bars
        rows={(data?.days ?? []).map((row) => ({
          label: `Day ${row.day}`,
          value: row.retained,
          percentage: row.percentage,
          detail: `of ${row.eligible.toLocaleString("en")}`,
        }))}
      />
    </Report>
  );
};

const GuestShare = ({ days }: WindowProps) => {
  const { data } = useQuery(
    orpc.analytics.guestShare.queryOptions({ input: { days } })
  );
  return (
    <Report
      title="Guest share"
      description="Guests against signed-in Believers."
      empty={data?.events.guest === 0 && data.events.believer === 0}
    >
      {data ? (
        <Bars
          rows={[
            {
              label: "Guest installations",
              value: data.installs.guest,
              percentage: data.installs.guestPercentage,
            },
            {
              label: "Guest events",
              value: data.events.guest,
              percentage: data.events.guestPercentage,
            },
          ]}
        />
      ) : null}
    </Report>
  );
};

const Devices = ({ days }: WindowProps) => {
  const { data } = useQuery(
    orpc.analytics.devices.queryOptions({ input: { days } })
  );
  return (
    <Report
      title="Devices"
      description={`${data?.installs.toLocaleString("en") ?? 0} active installations.`}
      empty={data?.installs === 0}
    >
      {data ? (
        <div className="flex flex-col gap-4">
          <Bars rows={shareRows(data.platforms)} />
          <Bars rows={shareRows(data.deviceTypes)} />
          <h3 className="text-sm font-medium">System versions</h3>
          <Bars rows={shareRows(data.osVersions)} />
          <h3 className="text-sm font-medium">App versions</h3>
          <Bars rows={shareRows(data.appVersions)} />
        </div>
      ) : null}
    </Report>
  );
};

const Ages = ({ days }: WindowProps) => {
  const { data } = useQuery(
    orpc.analytics.ages.queryOptions({ input: { days } })
  );
  return (
    <Report
      title="Ages"
      description={`${data?.withBirthYear ?? 0} active people gave a birth year; ${data?.withoutBirthYear ?? 0} did not.`}
      empty={data?.withBirthYear === 0}
    >
      <Bars
        rows={(data?.bands ?? []).map((row) => ({
          label: AGE_LABELS[row.band],
          value: row.count,
          percentage: row.percentage,
        }))}
      />
    </Report>
  );
};

const WindowReports = ({ days }: WindowProps) => (
  <div className="grid gap-4 lg:grid-cols-2">
    {/* A new period starts again from the latest days. */}
    <DailyActiveUsers key={days} days={days} />
    <PopularSections days={days} />
    <FeatureUsage days={days} />
    <Retention days={days} />
    <GuestShare days={days} />
    <Devices days={days} />
    <Ages days={days} />
  </div>
);

export const AnalyticsScreen = () => {
  const [days, setDays] = useState<number>(30);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usage analytics</h1>
          <p className="text-muted-foreground">
            Anonymous usage events sent by the app, computed on our server. No
            third-party analytics.
          </p>
        </div>
        <fieldset className="flex gap-2">
          <legend className="sr-only">Period</legend>
          {WINDOWS.map((window) => (
            <Button
              key={window}
              type="button"
              variant={window === days ? "default" : "outline"}
              aria-pressed={window === days}
              onClick={() => setDays(window)}
            >
              Last {window} days
            </Button>
          ))}
        </fieldset>
      </div>
      <Summary />
      <WindowReports days={days} />
    </main>
  );
};
