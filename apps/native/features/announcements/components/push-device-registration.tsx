import "../i18n";
import { usePushDevice } from "../hooks/use-push-device";

/** Mounted once at the root: keeps this device registered for Announcements. */
export const PushDeviceRegistration = () => {
  usePushDevice();
  return null;
};
