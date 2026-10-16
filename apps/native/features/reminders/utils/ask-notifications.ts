import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications";

/**
 * Asks for notifications at the moment a feature first needs them (saving or
 * testing an alert), after the screen has said why. Never asks twice: a
 * decided permission is only read. Returns whether notifications may be shown.
 */
export const askNotificationsInContext = async (): Promise<boolean> => {
  const current = await getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!current.canAskAgain) {
    return false;
  }
  const asked = await requestPermissionsAsync();
  return asked.granted;
};
