import type { ReactNode } from "react";

import { Label } from "@/shared/ui/label";

/** A labelled form control with its validation error under it. */
export const Field = ({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && !error ? (
      <p className="text-muted-foreground text-xs">{hint}</p>
    ) : null}
    {error ? (
      <p id={`${id}-error`} className="text-destructive text-xs">
        {error}
      </p>
    ) : null}
  </div>
);
