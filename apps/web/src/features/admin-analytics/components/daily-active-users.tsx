import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";

import { Report } from "./report-parts";

/** Active installations per UTC day, a column each, with paging back. */
export const DailyActiveUsers = ({ days }: { days: number }) => {
  const [offset, setOffset] = useState(0);
  const report = useQuery(
    orpc.analytics.dailyActiveUsers.queryOptions({ input: { days, offset } })
  );
  const rows = report.data ?? [];
  const peak = Math.max(0, ...rows.map(({ installs }) => installs));
  const first = rows.at(0)?.date;
  const last = rows.at(-1)?.date;

  return (
    <Report
      title="Daily active users"
      description="Installations that sent an event each day (UTC); the darker part signed in."
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOffset(offset + 1)}
        >
          Earlier
        </Button>
        <span className="text-muted-foreground">
          {first && last ? `${first} – ${last}` : "Loading..."}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => setOffset(offset - 1)}
        >
          Later
        </Button>
      </div>
      <ol className="flex h-40 items-end gap-px">
        {rows.map((row) => (
          <li
            key={row.date}
            className="bg-primary/30 flex flex-1 flex-col justify-end"
            style={{ height: `${peak > 0 ? (row.installs / peak) * 100 : 0}%` }}
            title={`${row.date}: ${row.installs} active, ${row.believers} signed in`}
          >
            <span
              className="bg-primary block"
              style={{
                height: `${row.installs > 0 ? (row.believers / row.installs) * 100 : 0}%`,
              }}
            />
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground text-xs">
        Peak: {peak.toLocaleString("en")} active installations.
      </p>
    </Report>
  );
};
