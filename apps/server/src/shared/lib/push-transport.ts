/** One push notification to one device. */
export interface PushMessage {
  /** The device's Expo push token. */
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

/**
 * Expo's answer for one message, in the order sent. `error` names Expo's
 * error code (e.g. `DeviceNotRegistered`: the token is dead).
 */
export type PushTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; error: string | null };

/** Expo's final word on one ticket, from the push service (APNs, FCM). */
export type PushReceipt =
  | { status: "ok" }
  | { status: "error"; message: string; error: string | null };

/**
 * How Announcements leave the server: Expo Push, or a fake in tests.
 * Implementations split large batches themselves.
 */
export interface PushTransport {
  send: (messages: readonly PushMessage[]) => Promise<PushTicket[]>;
  /** The receipts ready so far, by ticket id; absent ids are not ready. */
  receipts: (ticketIds: readonly string[]) => Promise<Map<string, PushReceipt>>;
}
