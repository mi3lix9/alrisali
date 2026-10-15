// A synchronous, typed publish/subscribe channel. Features never import each
// other (ADR-0005), so a reaction in one feature to something that happened in
// another travels as an event: the emitter and the listener only share the
// event map in `shared/lib/events.ts`.

type Listener<Payload> = (payload: Payload) => void;

/** An event whose payload is `undefined` is emitted with no argument. */
type EmitArgs<Payload> = [Payload] extends [undefined]
  ? []
  : [payload: Payload];

export interface EventBus<Events extends object> {
  emit: <Name extends keyof Events>(
    name: Name,
    ...args: EmitArgs<Events[Name]>
  ) => void;
  /** Subscribes to one event; call the returned function to unsubscribe. */
  on: <Name extends keyof Events>(
    name: Name,
    listener: Listener<Events[Name]>
  ) => () => void;
}

export const createEventBus = <Events extends object>(): EventBus<Events> => {
  const listeners: {
    [Name in keyof Events]?: Set<Listener<Events[Name]>>;
  } = {};

  return {
    emit: (name, ...args) => {
      // EmitArgs is either [] (payload `undefined`) or [payload].
      const payload = args[0] as Events[typeof name];
      // Snapshot so listeners added or removed while notifying take effect
      // from the next emit.
      const snapshot = [...(listeners[name] ?? [])];
      for (const listener of snapshot) {
        listener(payload);
      }
    },
    on: (name, listener) => {
      const named = listeners[name] ?? new Set();
      listeners[name] = named;
      named.add(listener);
      return () => {
        named.delete(listener);
      };
    },
  };
};
