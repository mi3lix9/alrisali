import { ORPCError } from "@orpc/server";

import type { RecitationSource } from "@/shared/lib/recitation-source";

import { createQuranFoundationSource } from "./quran-foundation";
import type { QuranFoundationEnvironment } from "./quran-foundation";

export interface RecitationSourceEnv {
  NODE_ENV?: string;
  QF_CLIENT_ID?: string;
  QF_CLIENT_SECRET?: string;
  QF_ENV?: QuranFoundationEnvironment;
}

/**
 * The Quran Foundation audio API. Production refuses to start without its
 * credentials; elsewhere recitation answers "unavailable" until they are set.
 */
export const createRecitationSource = (
  env: RecitationSourceEnv
): RecitationSource => {
  const { QF_CLIENT_ID, QF_CLIENT_SECRET } = env;
  if (QF_CLIENT_ID && QF_CLIENT_SECRET) {
    return createQuranFoundationSource({
      clientId: QF_CLIENT_ID,
      clientSecret: QF_CLIENT_SECRET,
      environment: env.QF_ENV ?? "prelive",
    });
  }
  const missing = [
    QF_CLIENT_ID ? null : "QF_CLIENT_ID",
    QF_CLIENT_SECRET ? null : "QF_CLIENT_SECRET",
  ].filter((name) => name !== null);
  const message = `Missing ${missing.join(", ")}: recitation streams from the Quran Foundation audio API`;
  if (env.NODE_ENV === "production") {
    throw new Error(message);
  }
  const unavailable = () =>
    Promise.reject(new ORPCError("SERVICE_UNAVAILABLE", { message }));
  return { reciters: unavailable, surahAudio: unavailable };
};
