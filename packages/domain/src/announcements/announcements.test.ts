import { describe, expect, it } from "vitest";

import {
  ACTIVE_WITHIN_DAYS,
  announcementDraftSchema,
  inAudience,
  isPublishable,
  missingLanguages,
  NEW_WITHIN_DAYS,
} from ".";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 15, 12);

const daysAgo = (days: number) => NOW - days * DAY;

describe("audience", () => {
  const longStanding = { lastSeenAt: daysAgo(1), joinedAt: daysAgo(400) };
  const lapsed = { lastSeenAt: daysAgo(60), joinedAt: daysAgo(400) };
  const newcomer = { lastSeenAt: daysAgo(0), joinedAt: daysAgo(3) };

  it("reaches everyone with All", () => {
    for (const recipient of [longStanding, lapsed, newcomer]) {
      expect(inAudience("all", recipient, NOW)).toBeTruthy();
    }
  });

  it("reaches only Believers who opened the app lately with Active", () => {
    expect(inAudience("active", longStanding, NOW)).toBeTruthy();
    expect(inAudience("active", newcomer, NOW)).toBeTruthy();
    expect(inAudience("active", lapsed, NOW)).toBeFalsy();
    expect(
      inAudience(
        "active",
        { ...lapsed, lastSeenAt: daysAgo(ACTIVE_WITHIN_DAYS) },
        NOW
      )
    ).toBeTruthy();
  });

  it("reaches only Believers who joined lately with New", () => {
    expect(inAudience("new", newcomer, NOW)).toBeTruthy();
    expect(inAudience("new", longStanding, NOW)).toBeFalsy();
    expect(
      inAudience(
        "new",
        { ...longStanding, joinedAt: daysAgo(NEW_WITHIN_DAYS + 1) },
        NOW
      )
    ).toBeFalsy();
  });
});

describe("publishing", () => {
  const text = {
    ar: { title: "رمضان كريم", body: "تقبل الله أعمالكم" },
    en: { title: "Ramadan Kareem", body: "May God accept your deeds" },
  };

  it("is ready when both languages have a title and a body", () => {
    expect(isPublishable(text)).toBeTruthy();
    expect(missingLanguages(text)).toStrictEqual([]);
  });

  it("names the languages still missing text", () => {
    expect(
      missingLanguages({ ...text, en: { title: "Ramadan", body: "  " } })
    ).toStrictEqual(["en"]);
    expect(
      isPublishable({ ar: { title: "", body: "" }, en: text.en })
    ).toBeFalsy();
  });

  it("trims what an Admin wrote and refuses an unknown audience", () => {
    expect(
      announcementDraftSchema.parse({
        text: { ar: { title: " عنوان ", body: "نص" }, en: text.en },
        audience: "new",
      }).text.ar.title
    ).toBe("عنوان");
    expect(
      announcementDraftSchema.safeParse({ text, audience: "admins" }).success
    ).toBeFalsy();
  });
});
