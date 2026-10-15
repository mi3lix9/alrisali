import { describe, expect, it } from "vitest";

import { createQuranFoundationSource } from "./quran-foundation";

const OAUTH = "https://prelive-oauth2.quran.foundation";
const API = "https://apis-prelive.quran.foundation/content/api/v4";

interface Recorded {
  url: string;
  headers: Headers;
  body: string;
}

/** A stand-in for Quran Foundation's OAuth2 and Content API servers. */
const fakeQuranFoundation = (
  routes: Record<string, (request: Recorded) => Response>
) => {
  const requests: Recorded[] = [];
  let tokens = 0;
  const fetch = async (url: string, init?: RequestInit) => {
    const request = new Request(url, init);
    const recorded: Recorded = {
      url: request.url,
      headers: request.headers,
      body: await request.text(),
    };
    requests.push(recorded);
    if (request.url === `${OAUTH}/oauth2/token`) {
      tokens += 1;
      return Response.json({
        access_token: `token-${tokens}`,
        token_type: "bearer",
        expires_in: 3600,
        scope: "content",
      });
    }
    const route = routes[request.url];
    return route ? route(recorded) : new Response("Not Found", { status: 404 });
  };
  return { fetch, requests };
};

const RECITATIONS = `${API}/resources/recitations?language=ar`;

const recitations = () =>
  Response.json({
    recitations: [
      {
        id: 7,
        reciter_name: "Mishari Rashid al-`Afasy",
        style: null,
        translated_name: {
          name: "مشاري راشد العفاسي",
          language_name: "arabic",
        },
      },
      {
        id: 2,
        reciter_name: "AbdulBaset AbdulSamad",
        style: "Murattal",
        translated_name: {
          name: "AbdulBaset AbdulSamad",
          language_name: "english",
        },
      },
    ],
  });

const audioPage = (number: number) =>
  `${API}/recitations/7/by_chapter/1?per_page=50&page=${number}`;

const setUp = (
  routes: Record<string, (request: Recorded) => Response>,
  now = () => 0
) => {
  const server = fakeQuranFoundation(routes);
  const source = createQuranFoundationSource({
    clientId: "client-id",
    clientSecret: "client-secret",
    environment: "prelive",
    fetch: server.fetch,
    now,
  });
  return { source, requests: server.requests };
};

describe(createQuranFoundationSource, () => {
  it("lists reciters with their Arabic and English names", async () => {
    const { source } = setUp({ [RECITATIONS]: recitations });
    await expect(source.reciters()).resolves.toStrictEqual([
      {
        id: 7,
        name: { ar: "مشاري راشد العفاسي", en: "Mishari Rashid al-`Afasy" },
        style: null,
      },
      {
        id: 2,
        name: { ar: "AbdulBaset AbdulSamad", en: "AbdulBaset AbdulSamad" },
        style: "Murattal",
      },
    ]);
  });

  it("authenticates with client credentials and sends both required headers", async () => {
    const { source, requests } = setUp({ [RECITATIONS]: recitations });
    await source.reciters();

    const [tokenRequest, apiRequest] = requests;
    expect(tokenRequest?.headers.get("authorization")).toBe(
      `Basic ${btoa("client-id:client-secret")}`
    );
    expect(new URLSearchParams(tokenRequest?.body)).toStrictEqual(
      new URLSearchParams({
        grant_type: "client_credentials",
        scope: "content",
      })
    );
    expect(apiRequest?.headers.get("x-auth-token")).toBe("token-1");
    expect(apiRequest?.headers.get("x-client-id")).toBe("client-id");
  });

  it("reuses a token until shortly before it expires", async () => {
    let now = 0;
    const { source, requests } = setUp(
      { [RECITATIONS]: recitations },
      () => now
    );
    await source.reciters();
    now = 3_000_000;
    await source.reciters();
    now = 3_590_000;
    await source.reciters();

    const tokenRequests = requests.filter((request) =>
      request.url.endsWith("/oauth2/token")
    );
    expect(tokenRequests).toHaveLength(2);
  });

  it("fetches a new token once when the API rejects the cached one", async () => {
    const { source, requests } = setUp({
      [RECITATIONS]: (request) =>
        request.headers.get("x-auth-token") === "token-1"
          ? Response.json({ type: "unauthorized" }, { status: 401 })
          : recitations(),
    });
    await expect(source.reciters()).resolves.toHaveLength(2);
    expect(requests.at(-1)?.headers.get("x-auth-token")).toBe("token-2");
  });

  it("reports a failure without retrying a request that is refused again", async () => {
    const { source } = setUp({
      [RECITATIONS]: () =>
        Response.json({ type: "forbidden" }, { status: 403 }),
    });
    await expect(source.reciters()).rejects.toThrow(
      "Quran Foundation /resources/recitations failed: 403"
    );
  });

  it("gives every ayah of a surah, following the pages, with absolute URLs", async () => {
    const { source } = setUp({
      [audioPage(1)]: () =>
        Response.json({
          audio_files: [
            { verse_key: "1:1", url: "Alafasy/mp3/001001.mp3" },
            { verse_key: "1:2", url: "//mirrors.quranicaudio.com/001002.mp3" },
          ],
          pagination: { next_page: 2 },
        }),
      [audioPage(2)]: () =>
        Response.json({
          audio_files: [
            {
              verse_key: "1:3",
              url: "https://verses.quran.foundation/Alafasy/mp3/001003.mp3",
            },
          ],
          pagination: { next_page: null },
        }),
    });
    await expect(source.surahAudio(7, 1)).resolves.toStrictEqual([
      {
        ayah: "1:1",
        url: "https://verses.quran.foundation/Alafasy/mp3/001001.mp3",
      },
      { ayah: "1:2", url: "https://mirrors.quranicaudio.com/001002.mp3" },
      {
        ayah: "1:3",
        url: "https://verses.quran.foundation/Alafasy/mp3/001003.mp3",
      },
    ]);
  });
});
