import { describe, expect, it } from "vitest";

import { resumeSection } from "./position";

describe(resumeSection, () => {
  it("offers nothing for a Supplication never read", () => {
    expect(resumeSection(null, 112)).toBeNull();
  });

  it("offers nothing when the Believer stopped at the first section", () => {
    expect(resumeSection(0, 112)).toBeNull();
  });

  it("offers to continue at the section the Believer reached", () => {
    expect(resumeSection(40, 112)).toBe(40);
  });

  it("keeps a saved section inside a text that has since become shorter", () => {
    expect(resumeSection(150, 112)).toBe(111);
  });

  it("offers nothing while the text has not loaded", () => {
    expect(resumeSection(40, 0)).toBeNull();
  });
});
