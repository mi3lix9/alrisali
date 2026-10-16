import { Button } from "panelui-native";

import { Screen } from "@/shared/ui/screen";

/** Throws an uncaught error on press, to check that Sentry receives app errors. */
export const SentryTestErrorScreen = () => (
  <Screen>
    <Button
      onPress={() => {
        throw new Error("Sentry test error (native)");
      }}
    >
      Throw test error
    </Button>
  </Screen>
);
