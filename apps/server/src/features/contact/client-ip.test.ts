import { describe, expect, it } from "vitest";

import { clientIpOf } from "./client-ip";

const bun = {
  requestIP: () => ({ address: "10.0.0.1" }),
};

describe("client IP", () => {
  it("trusts the address the edge proxy saw", () => {
    const request = new Request("http://localhost/rpc", {
      headers: { "x-real-ip": "203.0.113.7" },
    });
    expect(clientIpOf(request, bun)).toBe("203.0.113.7");
  });

  it("uses the socket's address without a proxy", () => {
    expect(clientIpOf(new Request("http://localhost/rpc"), bun)).toBe(
      "10.0.0.1"
    );
  });

  it("knows no address outside Bun", () => {
    expect(clientIpOf(new Request("http://localhost/rpc"))).toBeNull();
  });
});
