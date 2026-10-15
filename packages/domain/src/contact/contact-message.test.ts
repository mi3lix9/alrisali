import { describe, expect, it } from "vitest";

import { contactMessageSchema } from "./contact-message";

const valid = {
  name: "Zainab",
  email: "zainab@example.com",
  subject: "Prayer Times",
  message: "Fajr shows a minute late in Karbala.",
};

const fieldsRejected = (input: unknown): (PropertyKey | undefined)[] =>
  contactMessageSchema
    .safeParse(input)
    .error?.issues.map(({ path }) => path[0]) ?? [];

describe("contact message", () => {
  it("accepts a message within every limit", () => {
    expect(contactMessageSchema.parse(valid)).toStrictEqual(valid);
  });

  it("trims what the Believer typed", () => {
    expect(
      contactMessageSchema.parse({
        name: "  Zainab ",
        email: " zainab@example.com ",
        subject: " Prayer Times ",
        message: "  Fajr shows a minute late in Karbala.\n",
      })
    ).toStrictEqual(valid);
  });

  it.each([
    ["name", "Z"],
    ["name", "z".repeat(101)],
    ["email", "zainab"],
    ["email", `${"z".repeat(250)}@example.com`],
    ["subject", "Hi"],
    ["subject", "s".repeat(121)],
    ["message", "Too short"],
    ["message", "m".repeat(3001)],
  ])("rejects a %s of %j", (field, value) => {
    expect(fieldsRejected({ ...valid, [field]: value })).toStrictEqual([field]);
  });

  it("does not count surrounding spaces toward the minimum", () => {
    expect(fieldsRejected({ ...valid, name: "  Z  " })).toStrictEqual(["name"]);
  });

  it("accepts each limit exactly", () => {
    expect(
      contactMessageSchema.safeParse({
        name: "Al",
        email: valid.email,
        subject: "s".repeat(120),
        message: "m".repeat(3000),
      }).success
    ).toBeTruthy();
  });
});
