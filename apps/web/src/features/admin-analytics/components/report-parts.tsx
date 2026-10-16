import type { ReactNode } from "react";

/** One report: a titled panel that says so when it has nothing to show. */
export const Report = ({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description?: string;
  /** Shown instead of the content when there is no data yet. */
  empty?: boolean;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-3 border p-4">
    <div>
      <h2 className="font-medium">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
    {empty ? (
      <p className="text-muted-foreground text-sm">No events yet.</p>
    ) : (
      children
    )}
  </section>
);

export const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col border p-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="text-2xl font-semibold tabular-nums">
      {value.toLocaleString("en")}
    </span>
  </div>
);

export interface BarRow {
  label: string;
  value: number;
  /** 0–100: the bar's length. */
  percentage: number;
  detail?: string;
}

/** A horizontal bar per row, with its value and share. */
export const Bars = ({ rows }: { rows: readonly BarRow[] }) => (
  <ul className="flex flex-col gap-2">
    {rows.map((row) => (
      <li key={row.label} className="flex flex-col gap-1">
        <div className="flex justify-between gap-4 text-sm">
          <span className="truncate">{row.label}</span>
          <span className="text-muted-foreground shrink-0 tabular-nums">
            {row.value.toLocaleString("en")} · {row.percentage}%
            {row.detail ? ` · ${row.detail}` : ""}
          </span>
        </div>
        <div className="bg-muted h-2" aria-hidden>
          <div
            className="bg-primary h-2"
            style={{ width: `${row.percentage}%` }}
          />
        </div>
      </li>
    ))}
  </ul>
);
