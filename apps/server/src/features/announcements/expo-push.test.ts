import { describe, expect, it } from "vitest";

import { createExpoPushTransport } from "./expo-push";

interface Request {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

/** Stand-in for Expo's push API answering with `reply(path, body)`. */
const fakeExpo = (reply: (path: string, body: unknown) => unknown) => {
  const requests: Request[] = [];
  const request = (
    url: string | URL | globalThis.Request,
    init?: RequestInit
  ) => {
    const body = JSON.parse(String(init?.body));
    requests.push({
      url: String(url),
      headers: init?.headers as Record<string, string>,
      body,
    });
    return Promise.resolve(
      Response.json(reply(String(url).split("/").at(-1) ?? "", body))
    );
  };
  return { requests, fetch: request as typeof fetch };
};

const message = (device: number) => ({
  to: `ExponentPushToken[${device}]`,
  title: "Eid Mubarak",
  body: "Blessed Eid",
  data: { announcementId: "a1" },
});

describe("Expo Push transport", () => {
  it("sends in batches of 100 with the access token, and reads tickets in order", async () => {
    const expo = fakeExpo((_path, body) => ({
      data: (body as { to: string }[]).map(({ to }) =>
        to === "ExponentPushToken[3]"
          ? {
              status: "error",
              message: `"${to}" is not a registered push notification recipient`,
              details: { error: "DeviceNotRegistered" },
            }
          : { status: "ok", id: `ticket-${to}` }
      ),
    }));
    const push = createExpoPushTransport({
      accessToken: "expo-token",
      fetch: expo.fetch,
    });

    const tickets = await push.send(
      Array.from({ length: 150 }, (_, index) => message(index))
    );

    expect(
      expo.requests.map(({ body }) => (body as unknown[]).length)
    ).toStrictEqual([100, 50]);
    expect(expo.requests[0]).toMatchObject({
      url: "https://exp.host/--/api/v2/push/send",
      headers: { authorization: "Bearer expo-token" },
      body: expect.arrayContaining([
        { ...message(0), sound: "default", channelId: "announcements" },
      ]),
    });
    expect(tickets).toHaveLength(150);
    expect(tickets[0]).toStrictEqual({
      status: "ok",
      id: "ticket-ExponentPushToken[0]",
    });
    expect(tickets[3]).toStrictEqual({
      status: "error",
      message:
        '"ExponentPushToken[3]" is not a registered push notification recipient',
      error: "DeviceNotRegistered",
    });
  });

  it("reads receipts, leaving out those not ready", async () => {
    const expo = fakeExpo(() => ({
      data: {
        t1: { status: "ok" },
        t2: {
          status: "error",
          message: "The device cannot receive push notifications",
          details: { error: "DeviceNotRegistered" },
        },
      },
    }));
    const push = createExpoPushTransport({ fetch: expo.fetch });

    const receipts = await push.receipts(["t1", "t2", "t3"]);

    expect(expo.requests[0]).toMatchObject({
      url: "https://exp.host/--/api/v2/push/getReceipts",
      body: { ids: ["t1", "t2", "t3"] },
    });
    expect(expo.requests[0]?.headers).not.toHaveProperty("authorization");
    expect([...receipts]).toStrictEqual([
      ["t1", { status: "ok" }],
      [
        "t2",
        {
          status: "error",
          message: "The device cannot receive push notifications",
          error: "DeviceNotRegistered",
        },
      ],
    ]);
  });

  it("fails loudly when Expo refuses the request", async () => {
    const push = createExpoPushTransport({
      fetch: (() =>
        Promise.resolve(
          new Response("unauthorized", { status: 401 })
        )) as unknown as typeof fetch,
    });

    await expect(push.send([message(1)])).rejects.toThrow(
      "Expo Push send answered 401: unauthorized"
    );
  });
});
