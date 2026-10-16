import type { AdhanSound } from "@alrisali/domain/reminders";
import { adhanIdOfFile } from "@alrisali/domain/shared";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { adhanFileUri } from "../data/adhan-catalogue";

// iOS plays a notification's sound from the app bundle or from the app's
// `Library/Sounds` folder, by file name. A takbir cut the Believer downloaded
// is copied there, under the name it is stored by, so an At-Time Alert can
// sound it. Android cannot (a channel's sound must be built into the app), so
// its takbir and adhan play through the adhan service instead.

const soundsDirectory = () =>
  new Directory(Paths.document.parentDirectory, "Library", "Sounds");

/**
 * Puts the installed takbir cuts in `Library/Sounds` and removes the ones of
 * voices no longer installed. Nothing on Android.
 */
export const syncNotificationSounds = (
  installed: readonly AdhanSound[]
): void => {
  if (Platform.OS !== "ios") {
    return;
  }
  const directory = soundsDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const wanted = new Set(installed.map(({ takbir }) => takbir.file));
  for (const entry of directory.list()) {
    if (
      entry instanceof File &&
      adhanIdOfFile(entry.name) !== null &&
      !wanted.has(entry.name)
    ) {
      entry.delete();
    }
  }
  for (const name of wanted) {
    const source = adhanFileUri(name);
    if (source === null) {
      continue;
    }
    const from = new File(source);
    const target = new File(directory, name);
    // A recording an Admin replaced is downloaded under the same name.
    if (!target.exists || target.size !== from.size) {
      if (target.exists) {
        target.delete();
      }
      from.copy(target);
    }
  }
};
