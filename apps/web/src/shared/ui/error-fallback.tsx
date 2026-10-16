import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

import { reportError } from "@/shared/lib/monitoring";

/** Route error screen: reports the error to Sentry and offers a retry. */
export const ErrorFallback = ({ error, reset }: ErrorComponentProps) => {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <p>Something went wrong.</p>
      <button type="button" className="underline" onClick={reset}>
        Try again
      </button>
    </div>
  );
};
