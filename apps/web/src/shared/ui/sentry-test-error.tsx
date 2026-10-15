import { Button } from "@alrisali/ui/components/button";

/** Throws an uncaught error on click, to check that Sentry receives web errors. */
export const SentryTestErrorScreen = () => (
  <div className="flex items-center justify-center p-8">
    <Button
      onClick={() => {
        throw new Error("Sentry test error (web)");
      }}
    >
      Throw test error
    </Button>
  </div>
);
