import { createHash } from "node:crypto";

import { ADHAN_UPLOAD_PURPOSES } from "@alrisali/domain/shared";
import type { AdhanCut } from "@alrisali/domain/shared";

/**
 * The Shia Adhan voices every install of Al-Risali starts with. They are
 * published to the adhan catalogue like any Admin's voice (`bun run
 * adhans:seed`), so devices list and download them on demand. The audio is in
 * `apps/server/seed/adhans`; the credits are also in `CONTENT_SOURCES` and the
 * Sources screen.
 */
export interface AdhanSeedVoice {
  id: string;
  name: { ar: string; en: string };
  credit: string;
  /** The seed file of each cut, in `seed/adhans`, and its length. */
  cuts: Record<
    AdhanCut,
    { file: string; contentType: string; seconds: number }
  >;
}

export const ADHAN_SEED_VOICES: readonly AdhanSeedVoice[] = [
  {
    id: "hatamzadeh",
    name: {
      ar: "سعيد حاتم زاده ورماهور",
      en: "Saeed Hatamzadeh-Varmazyar",
    },
    credit:
      "Saeed Hatamzadeh-Varmazyar, “AzaanMaahur.ogg”, Wikimedia Commons, CC BY-SA 4.0 (opening takbeer excerpt and full recording, converted).",
    cuts: {
      full: {
        file: "hatamzadeh-full.m4a",
        contentType: "audio/mp4",
        seconds: 167.8,
      },
      takbir: {
        file: "hatamzadeh-takbir.wav",
        contentType: "audio/wav",
        seconds: 28.8,
      },
    },
  },
  {
    id: "sobhdel",
    name: { ar: "الحاج حسين صبحدل", en: "Hussein Sobhdel" },
    credit:
      "Hajj Hussein Sobhdel (a Koorosh Orooj video), Wikimedia Commons, CC BY-SA 4.0, OTRS ticket 2020110810007063 (audio extracted, trimmed and converted).",
    cuts: {
      full: {
        file: "sobhdel-full.m4a",
        contentType: "audio/mp4",
        seconds: 355.2,
      },
      takbir: {
        file: "sobhdel-takbir.wav",
        contentType: "audio/wav",
        seconds: 28.5,
      },
    },
  },
];

const EXTENSIONS: Record<string, string> = {
  "audio/mp4": "m4a",
  "audio/wav": "wav",
};

/**
 * The bucket key of a seed recording. Fixed (a UUID derived from the voice
 * and the cut), so seeding again overwrites the same file, not a new one.
 */
export const seedKey = (
  { id, cuts }: AdhanSeedVoice,
  cut: AdhanCut
): string => {
  const hex = createHash("sha256")
    .update(`adhan-seed:${id}:${cut}`)
    .digest("hex");
  const uuid = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
  return `${ADHAN_UPLOAD_PURPOSES[cut]}/${uuid}.${EXTENSIONS[cuts[cut].contentType]}`;
};
