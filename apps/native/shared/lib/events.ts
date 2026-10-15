import { createEventBus } from "./event-bus";

// Every cross-feature event, by name. A feature emits or listens to these
// through `events`; it never imports the feature on the other side. Add an
// event here when a feature needs another to react to it.
export interface AppEvents {
  /** A Believer signed in on this device. */
  SignedIn: { userId: string };
  /** The signed-in Believer signed out on this device. */
  SignedOut: undefined;
}

export const events = createEventBus<AppEvents>();
