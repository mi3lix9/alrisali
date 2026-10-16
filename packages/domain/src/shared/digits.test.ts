import { describe, expect, it } from "vitest";

import { readNumber, writeDigits } from "./digits";

describe(writeDigits, () => {
  it("writes Western digits as Arabic-Indic, with Arabic separators", () => {
    expect(writeDigits("1,234.5 – 7:05 – 50%", "arabic-indic")).toBe(
      "١٬٢٣٤٫٥ – ٧:٠٥ – ٥٠٪"
    );
  });

  it("writes Arabic-Indic digits as Western, with Western separators", () => {
    expect(writeDigits("١٬٢٣٤٫٥ – ٧:٠٥ – ٥٠٪", "latin")).toBe(
      "1,234.5 – 7:05 – 50%"
    );
  });

  it("keeps punctuation that is not between digits", () => {
    expect(writeDigits("Page 3, line 4.", "arabic-indic")).toBe(
      "Page ٣, line ٤."
    );
  });
});

describe(readNumber, () => {
  it("reads Western, Arabic-Indic and Persian digits", () => {
    expect(readNumber(" 15 ")).toBe(15);
    expect(readNumber("١٥")).toBe(15);
    expect(readNumber("۱۵")).toBe(15);
  });

  it("reads separators and a typographic minus", () => {
    expect(readNumber("١٬٢٣٤٫٥")).toBe(1234.5);
    expect(readNumber("1,234.5")).toBe(1234.5);
    expect(readNumber("−٢٦٫٥")).toBe(-26.5);
  });

  it("is null for blank or non-numeric text", () => {
    expect(readNumber("")).toBeNull();
    expect(readNumber("12a")).toBeNull();
    expect(readNumber("1.")).toBeNull();
  });
});
