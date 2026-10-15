import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createQuranReaderSettingsRepository } from "./reader-settings";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createQuranReaderSettingsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts in horizontal Page Mode", async () => {
    await expect(
      createQuranReaderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      mode: "page",
      pageNav: "horizontal",
      surahFontSize: 26,
    });
  });

  it("keeps the mode, page navigation and font size across a relaunch", async () => {
    const settings = createQuranReaderSettingsRepository(database.db);
    await settings.update({ pageNav: "vertical" });
    await settings.update({ mode: "surah", surahFontSize: 30 });

    await database.close();
    database = await launch();

    await expect(
      createQuranReaderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      mode: "surah",
      pageNav: "vertical",
      surahFontSize: 30,
    });
  });

  it("refuses values the reader does not offer", async () => {
    const settings = createQuranReaderSettingsRepository(database.db);
    await expect(settings.update({ surahFontSize: 100 })).rejects.toThrow(
      "Too big"
    );
    await expect(settings.get()).resolves.toMatchObject({ surahFontSize: 26 });
  });

  it("falls back to the default for a value synced from a newer app", async () => {
    await database.db.run(
      sql`INSERT INTO quran_reader_settings (id, mode, page_nav) VALUES ('believer', 'scroll', 'vertical')`
    );
    await expect(
      createQuranReaderSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      mode: "page",
      pageNav: "vertical",
      surahFontSize: 26,
    });
  });
});
