import { Redirect } from "expo-router";

import { SentryTestErrorScreen } from "@/shared/ui/sentry-test-error";

const DebugSentryRoute = () =>
  __DEV__ ? <SentryTestErrorScreen /> : <Redirect href="/" />;

export default DebugSentryRoute;
