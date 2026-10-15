import { z } from "zod";

import type {
  PushMessage,
  PushReceipt,
  PushTicket,
  PushTransport,
} from "@/shared/lib/push-transport";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push";

// Expo's limits per request.
const SEND_BATCH = 100;
const RECEIPTS_BATCH = 1000;

/** Announcements' Android notification channel (created by the app). */
export const ANNOUNCEMENTS_CHANNEL = "announcements";

const outcome = z.union([
  z.object({ status: z.literal("ok"), id: z.string().optional() }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
    details: z.object({ error: z.string().optional() }).optional(),
  }),
]);

const sendResponse = z.object({ data: z.array(outcome) });
const receiptsResponse = z.object({ data: z.record(z.string(), outcome) });

type Outcome = z.infer<typeof outcome>;

const failure = (result: Extract<Outcome, { status: "error" }>) => ({
  status: "error" as const,
  message: result.message,
  error: result.details?.error ?? null,
});

const chunks = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );

export interface ExpoPushOptions {
  /**
   * Required only when the Expo project enforces push security
   * (EXPO_ACCESS_TOKEN).
   */
  accessToken?: string | undefined;
  /** Stand-in for tests. */
  fetch?: typeof fetch;
}

/** Expo Push over its HTTP API (https://docs.expo.dev/push-notifications/sending-notifications/). */
export const createExpoPushTransport = ({
  accessToken,
  fetch: request = fetch,
}: ExpoPushOptions = {}): PushTransport => {
  const post = async (path: string, body: unknown): Promise<unknown> => {
    const response = await request(`${EXPO_PUSH_URL}/${path}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        `Expo Push ${path} answered ${response.status}: ${await response.text()}`
      );
    }
    return response.json();
  };

  return {
    send: async (messages) => {
      const tickets: PushTicket[] = [];
      for (const batch of chunks(messages, SEND_BATCH)) {
        const body = batch.map((message: PushMessage) => ({
          ...message,
          sound: "default",
          channelId: ANNOUNCEMENTS_CHANNEL,
        }));
        // oxlint-disable-next-line no-await-in-loop -- Expo rate-limits bursts; batches go one at a time
        const response = await post("send", body);
        const { data } = sendResponse.parse(response);
        tickets.push(
          ...data.map((result): PushTicket =>
            result.status === "ok"
              ? { status: "ok", id: result.id ?? "" }
              : failure(result)
          )
        );
      }
      return tickets;
    },
    receipts: async (ticketIds) => {
      const receipts = new Map<string, PushReceipt>();
      for (const batch of chunks(ticketIds, RECEIPTS_BATCH)) {
        // oxlint-disable-next-line no-await-in-loop -- one request at a time
        const response = await post("getReceipts", { ids: batch });
        const { data } = receiptsResponse.parse(response);
        for (const [id, result] of Object.entries(data)) {
          receipts.set(
            id,
            result.status === "ok" ? { status: "ok" } : failure(result)
          );
        }
      }
      return receipts;
    },
  };
};
