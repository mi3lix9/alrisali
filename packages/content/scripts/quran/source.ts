// Fetches the KFGQPC Hafs v30 developer release (ADR-0004) and reads its
// members. Needs `unzip` on PATH.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const KFGQPC_ZIP_URL =
  "https://download.qurancomplex.gov.sa/resources_dev/kfgqpc_hafs_v30.zip";
export const KFGQPC_PAGE_URL = "https://qurancomplex.gov.sa/quran-dev/";
/** The release this dataset is built from (modified 2026-09-30). */
export const KFGQPC_ZIP_SHA256 =
  "227e6b1564d980f2bd09c2c35ebfb0330ac268c79a7c247cd1ab665bc635f245";

export const MEMBERS = {
  json: "kfgqpc_hafs_v30-data/kfgqpc_hafs_v30.json",
  pdf: "kfgqpc_hafs_v30-font/kfgqpc_hafs_v30.pdf",
  docx: "kfgqpc_hafs_v30-font/kfgqpc_hafs_v30.docx",
  font: "kfgqpc_hafs_v30-font/kfgqpc_hafs_v30.ttf",
} as const;

export const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

/** Returns the zip at `given`, or downloads it to the OS temp folder. */
export const loadZip = async (given: string | undefined): Promise<string> => {
  const zipPath =
    given ?? path.join(tmpdir(), "alrisali-kfgqpc", "kfgqpc_hafs_v30.zip");
  if (!existsSync(zipPath)) {
    const response = await fetch(KFGQPC_ZIP_URL);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${KFGQPC_ZIP_URL}`);
    }
    await Bun.write(zipPath, await response.arrayBuffer());
  }
  const digest = sha256(await Bun.file(zipPath).bytes());
  if (digest !== KFGQPC_ZIP_SHA256) {
    throw new Error(
      `${zipPath} is not the pinned kfgqpc_hafs_v30.zip (sha256 ${digest}). Update KFGQPC_ZIP_SHA256 only after re-checking the release.`
    );
  }
  return zipPath;
};

export const readMember = (zipPath: string, member: string): Uint8Array => {
  const result = Bun.spawnSync(["unzip", "-p", zipPath, member]);
  if (!result.success) {
    throw new Error(`unzip ${member}: ${result.stderr.toString()}`);
  }
  return result.stdout;
};

/** One ayah row of the KFGQPC data file. */
export interface KfgqpcAyah {
  id: number;
  jozz: number;
  page: number;
  sura_no: number;
  sura_name_en: string;
  sura_name_ar: string;
  line_start: number;
  line_end: number;
  aya_no: number;
  aya_text_unicode: string;
}

export const parseAyat = (bytes: Uint8Array): KfgqpcAyah[] => {
  const rows: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(rows)) {
    throw new TypeError("KFGQPC JSON is not an array of ayat");
  }
  return rows as KfgqpcAyah[];
};
