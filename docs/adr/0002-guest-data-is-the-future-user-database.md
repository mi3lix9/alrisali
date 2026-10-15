# Guest data is the future user database

A Guest gets every feature, and their records go into the same on-device database that later syncs to their own cloud database when they sign in. We don't keep a separate guest store that has to be migrated on sign-in. In the old app, Guests lost features and their local data never reached the server; giving each Believer their own database lets us remove that split.

## Consequences

- Signing out wipes the on-device database. What a Guest records is never shared with another account on the same device.
- No feature may need the server to work, except sign-in, Announcements and Contact Messages.
