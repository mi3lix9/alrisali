import { describe, expect, it } from "vitest";

import { writeDigits } from "./digits";

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
