import { getSupplication } from "@alrisali/content/books";
import { describe, expect, it } from "vitest";

import { SALAH } from "../shared/salah";
import { taqibatFor } from "./taqibat";

describe(taqibatFor, () => {
  it("opens Dua al-Sabah after Fajr", () => {
    expect(taqibatFor("fajr")?.id).toBe("mafatih-dua-sabah");
  });

  it("only ever opens a bundled Supplication", () => {
    const opened = SALAH.flatMap((salah) => taqibatFor(salah) ?? []);
    for (const taqibat of opened) {
      expect(getSupplication(taqibat.id)).toStrictEqual(taqibat);
    }
  });
});
