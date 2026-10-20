import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { KAABA_COORDINATES, SHRINE_COORDINATES, SHRINE_IDS } from ".";

const NOTICE = path.join(import.meta.dirname, "../../notices/qibla-targets.md");

describe("Shrine coordinates integrity", () => {
  it("lists Najaf, Karbala, Mashhad, Madina, Kadhimiya and Samarra", () => {
    expect([...SHRINE_IDS].toSorted()).toStrictEqual([
      "kadhimiya",
      "karbala",
      "madina",
      "mashhad",
      "najaf",
      "samarra",
    ]);
  });

  it("puts the Shrines where the cities lie", () => {
    const { najaf, karbala, kadhimiya, samarra, mashhad, madina } =
      SHRINE_COORDINATES;
    // Najaf is south of Karbala, which is south of Kadhimiya and Samarra.
    expect(najaf.latitude).toBeLessThan(karbala.latitude);
    expect(karbala.latitude).toBeLessThan(kadhimiya.latitude);
    expect(kadhimiya.latitude).toBeLessThan(samarra.latitude);
    // Mashhad is the far east; Madina is in the Hijaz, near the Kaaba.
    expect(mashhad.longitude).toBeGreaterThan(59);
    expect(
      Math.abs(madina.longitude - KAABA_COORDINATES.longitude)
    ).toBeLessThan(1);
  });

  it("keeps every coordinate on Earth", () => {
    for (const { latitude, longitude } of Object.values(SHRINE_COORDINATES)) {
      expect(Math.abs(latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(longitude)).toBeLessThanOrEqual(180);
    }
  });

  it("ships its notice", () => {
    expect(existsSync(NOTICE)).toBeTruthy();
  });
});
