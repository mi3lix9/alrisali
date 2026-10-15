# Reminders are scheduled on the device; the server only sends Announcements

All Reminders (Prayer Times, Imsak, Habits) are calculated and scheduled on the device as local notifications. The server sends only Announcements, through Expo Push. In the old app, a server job ran every 30 seconds, recalculated every user's Prayer Times with its own copy of the calculation, and guessed time zones from longitude. That needed location data on the server, didn't work offline, and drifted from what the app showed.

## Consequences

- The Prayer Time calculation exists once, in the app.
- The server never stores a Believer's location.
- iOS limits pending local notifications to 64, so the app has to top up a rolling window of upcoming Reminders whenever it runs.
