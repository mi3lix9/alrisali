import { z } from "zod";

import type { RecitationSource } from "@/shared/lib/recitation-source";

// The Quran Foundation Content API (v4) over OAuth2 client credentials:
// https://api-docs.quran.foundation/docs/quickstart

export const QURAN_FOUNDATION_ENVIRONMENTS = ["prelive", "production"] as const;
export type QuranFoundationEnvironment =
  (typeof QURAN_FOUNDATION_ENVIRONMENTS)[number];

const HOSTS: Record<
  QuranFoundationEnvironment,
  { oauth: string; api: string }
> = {
  prelive: {
    oauth: "https://prelive-oauth2.quran.foundation",
    api: "https://apis-prelive.quran.foundation/content/api/v4",
  },
  production: {
    oauth: "https://oauth2.quran.foundation",
    api: "https://apis.quran.foundation/content/api/v4",
  },
};

/** Where relative audio paths (`Alafasy/mp3/001001.mp3`) are served. */
const AUDIO_BASE_URL = "https://verses.quran.foundation/";

/** A token is renewed this long before Quran Foundation says it expires. */
const TOKEN_RENEW_MARGIN_MS = 60_000;

/** The largest page the audio file listing serves. */
const AUDIO_PAGE_SIZE = 50;

const HTTP_UNAUTHORIZED = 401;

const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});

const recitationsSchema = z.object({
  recitations: z.array(
    z.object({
      id: z.number().int().positive(),
      reciter_name: z.string().min(1),
      style: z.string().nullable(),
      translated_name: z
        .object({ name: z.string().min(1), language_name: z.string() })
        .nullish(),
    })
  ),
});

const audioFilesSchema = z.object({
  audio_files: z.array(z.object({ verse_key: z.string(), url: z.string() })),
  pagination: z.object({ next_page: z.number().int().nullable() }).nullish(),
});

export interface QuranFoundationOptions {
  clientId: string;
  clientSecret: string;
  environment: QuranFoundationEnvironment;
  /** Tests pass a stand-in for Quran Foundation's servers. */
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  now?: () => number;
}

/** Recitation from the Quran Foundation audio API. */
export const createQuranFoundationSource = ({
  clientId,
  clientSecret,
  environment,
  fetch = (url, init) => globalThis.fetch(url, init),
  now = Date.now,
}: QuranFoundationOptions): RecitationSource => {
  const hosts = HOSTS[environment];
  let token: { value: string; renewAt: number } | null = null;

  const requestToken = async (): Promise<string> => {
    const response = await fetch(`${hosts.oauth}/oauth2/token`, {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "content",
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Quran Foundation token request failed: ${response.status}`
      );
    }
    const body = tokenSchema.parse(await response.json());
    token = {
      value: body.access_token,
      renewAt: now() + body.expires_in * 1000 - TOKEN_RENEW_MARGIN_MS,
    };
    return body.access_token;
  };

  const currentToken = (): Promise<string> =>
    token && now() < token.renewAt
      ? Promise.resolve(token.value)
      : requestToken();

  /** GETs a Content API path; a rejected token is replaced and retried once. */
  const get = async <T>(path: string, schema: z.ZodType<T>): Promise<T> => {
    const send = (accessToken: string) =>
      fetch(`${hosts.api}${path}`, {
        headers: { "x-auth-token": accessToken, "x-client-id": clientId },
      });
    let response = await send(await currentToken());
    if (response.status === HTTP_UNAUTHORIZED) {
      token = null;
      response = await send(await requestToken());
    }
    if (!response.ok) {
      const [pathname] = path.split("?");
      throw new Error(
        `Quran Foundation ${pathname} failed: ${response.status}`
      );
    }
    return schema.parse(await response.json());
  };

  return {
    reciters: async () => {
      const { recitations } = await get(
        "/resources/recitations?language=ar",
        recitationsSchema
      );
      return recitations.map((recitation) => ({
        id: recitation.id,
        name: {
          ar: recitation.translated_name?.name ?? recitation.reciter_name,
          en: recitation.reciter_name,
        },
        style: recitation.style,
      }));
    },
    surahAudio: async (reciterId, surah) => {
      const audio: { ayah: string; url: string }[] = [];
      let page: number | null = 1;
      while (page !== null) {
        // oxlint-disable-next-line no-await-in-loop -- each page names the next
        const body: z.infer<typeof audioFilesSchema> = await get(
          `/recitations/${reciterId}/by_chapter/${surah}?per_page=${AUDIO_PAGE_SIZE}&page=${page}`,
          audioFilesSchema
        );
        for (const file of body.audio_files) {
          audio.push({
            ayah: file.verse_key,
            url: new URL(
              file.url.startsWith("//") ? `https:${file.url}` : file.url,
              AUDIO_BASE_URL
            ).href,
          });
        }
        page = body.pagination?.next_page ?? null;
      }
      return audio;
    },
  };
};
