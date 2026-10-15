import { describe, expect, it } from "vitest";

import { resumePosition } from "./position";

describe(resumePosition, () => {
  it("opens a Library Asset never opened before at its start", () => {
    expect(resumePosition("pdf", null, 120)).toBe(1);
    expect(resumePosition("audio", null, 3600)).toBe(0);
    expect(resumePosition("video", null, null)).toBe(0);
    expect(resumePosition("text", null, 40)).toBe(0);
  });

  it("reopens a PDF on the page the Believer left it at", () => {
    expect(resumePosition("pdf", 37, 120)).toBe(37);
  });

  it("keeps a saved page inside a PDF that has since become shorter", () => {
    expect(resumePosition("pdf", 150, 120)).toBe(120);
  });

  it("resumes audio and video at the second they stopped", () => {
    expect(resumePosition("audio", 754.5, 3600)).toBe(754.5);
    expect(resumePosition("video", 61, null)).toBe(61);
  });

  it("starts audio and video over once they were played to the end", () => {
    expect(resumePosition("audio", 3595, 3600)).toBe(0);
    expect(resumePosition("video", 3600, 3600)).toBe(0);
  });

  it("reopens structured text at the passage the Believer reached", () => {
    expect(resumePosition("text", 12, 40)).toBe(12);
    expect(resumePosition("text", 45, 40)).toBe(39);
  });
});
