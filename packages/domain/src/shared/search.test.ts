import { describe, expect, it } from "vitest";

import { matchesSearch, normalizeArabic, normalizeSearchText } from "./search";

describe(normalizeArabic, () => {
  it("strips tashkeel", () => {
    expect(normalizeArabic("الْحَمْدُ لِلَّهِ")).toBe("الحمد لله");
  });

  it("strips Quranic marks and the small alif", () => {
    expect(normalizeArabic("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ")).toBe(
      "بسم الله الرحمن الرحيم"
    );
    expect(normalizeArabic("إِنَّآ أَعۡطَيۡنَٰكَ ٱلۡكَوۡثَرَ")).toBe("انا اعطينك الكوثر");
  });

  it("strips tatweel", () => {
    expect(normalizeArabic("الرحمـــن")).toBe("الرحمن");
  });

  it("folds the alef forms into a bare alef", () => {
    expect(normalizeArabic("أَإِآٱ")).toBe("اااا");
  });

  it("folds alef maqsura into ya and ta marbuta into ha", () => {
    expect(normalizeArabic("الصلاة على موسى")).toBe("الصلاه علي موسي");
  });

  it("folds hamza on waw and ya into the bare letter", () => {
    expect(normalizeArabic("مُؤْمِن سَيِّئَة")).toBe("مومن سييه");
  });

  it("drops invisible direction marks and collapses spaces", () => {
    expect(normalizeArabic("\u200Fالحمد   لله ")).toBe("الحمد لله");
  });
});

describe(normalizeSearchText, () => {
  it("lowercases Latin and drops its accents and apostrophes", () => {
    expect(normalizeSearchText("Du'a Kumayl — Al-Fātiḥah")).toBe(
      "dua kumayl al fatihah"
    );
  });

  it("turns punctuation into spaces", () => {
    expect(normalizeSearchText("«دعاءُ كُمَيْل»، (١)")).toBe("دعاء كميل ١");
  });
});

describe(matchesSearch, () => {
  it("finds a vocalised text typed without diacritics", () => {
    expect(matchesSearch("دُعَاءُ كُمَيْلِ بْنِ زِيَادٍ", "دعاء كميل")).toBeTruthy();
  });

  it("finds a bare text typed with diacritics and other letter forms", () => {
    expect(matchesSearch("دعاء الصباح", "الصَّبَاحِ")).toBeTruthy();
    expect(matchesSearch("زيارة عاشوراء", "زياره عاشوراء")).toBeTruthy();
    expect(matchesSearch("مناجاة الشاكين", "مناجاه")).toBeTruthy();
    expect(matchesSearch("الإمام علي", "الامام")).toBeTruthy();
  });

  it("matches English case- and accent-insensitively", () => {
    expect(matchesSearch("Supplication of Kumayl", "KUMAYL")).toBeTruthy();
  });

  it("matches nothing for a query that is empty once normalised", () => {
    expect(matchesSearch("دعاء", "  َ ")).toBeFalsy();
  });

  it("does not match a different text", () => {
    expect(matchesSearch("دعاء كميل", "الصباح")).toBeFalsy();
  });
});
