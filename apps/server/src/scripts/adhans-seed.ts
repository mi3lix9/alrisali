// Publishes the default Shia Adhan voices (Hatamzadeh, Sobhdel) to the adhan
// catalogue: uploads their recordings to the files bucket and adds them to
// the content database. A voice already in the catalogue is left as it is, so
// an Admin's edits stick. Usage: bun run adhans:seed
import { readFile } from "node:fs/promises";

import { createAdhansRepository } from "@alrisali/db-content/shared";

import { ENV } from "@/env.server";
import { createUserDatabaseHost } from "@/features/account";
import { createContentDatabase } from "@/shared/lib/content-database";
import { createFileBucket } from "@/shared/lib/file-bucket";

import { ADHAN_SEED_VOICES, seedKey } from "./adhan-seed-data";
import type { AdhanSeedVoice } from "./adhan-seed-data";

const SEED_DIRECTORY = new URL("../../seed/adhans/", import.meta.url);

const files = createFileBucket(ENV);
const content = createContentDatabase({
  host: createUserDatabaseHost(ENV),
  name: ENV.CONTENT_DATABASE_NAME,
});
const database = await content.db();
const adhans = createAdhansRepository(database);

const upload = async (voice: AdhanSeedVoice, cut: "full" | "takbir") => {
  const { file, contentType, seconds } = voice.cuts[cut];
  const body = await readFile(new URL(file, SEED_DIRECTORY));
  const key = seedKey(voice, cut);
  const target = await files.presignUpload({
    key,
    contentType,
    size: body.byteLength,
  });
  const response = await fetch(target.url, {
    method: "PUT",
    headers: target.headers,
    body,
  });
  if (!response.ok) {
    throw new Error(`Uploading ${file} failed: HTTP ${response.status}`);
  }
  return { key, seconds, bytes: body.byteLength };
};

const seed = async (voice: AdhanSeedVoice, existing: ReadonlySet<string>) => {
  if (existing.has(voice.id)) {
    console.log(`${voice.id}: already in the catalogue, left as it is`);
    return;
  }
  const [full, takbir] = await Promise.all([
    upload(voice, "full"),
    upload(voice, "takbir"),
  ]);
  await adhans.save({
    id: voice.id,
    name: voice.name,
    credit: voice.credit,
    full,
    takbir,
  });
  console.log(`${voice.id}: published`);
};

const listed = await adhans.list();
const existing = new Set(listed.map(({ id }) => id));
// Ties in position (saved together) fall back to the id, so the order is stable.
await Promise.all(ADHAN_SEED_VOICES.map((voice) => seed(voice, existing)));
