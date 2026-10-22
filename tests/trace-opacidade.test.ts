import { describe, it, expect } from "vitest";
import { hostname, userInfo, homedir } from "node:os";
import { generateId } from "../src/telemetry/trace";

describe("AC-049 — nothing from the environment leaks into the identifier", () => {
  const values = () => Array.from({ length: 100 }, () => generateId());

  // TRACEABILITY: US-042 NFR-041 AC-049
  it("doesn't contain the username", () => {
    const u = userInfo().username.toLowerCase();
    for (const v of values()) expect(v.toLowerCase()).not.toContain(u);
  });

  // TRACEABILITY: US-042 NFR-041 AC-049
  it("doesn't contain an absolute path", () => {
    for (const v of values()) expect(v).not.toContain(homedir());
  });

  // TRACEABILITY: US-042 NFR-041 AC-049
  it("doesn't contain the machine name", () => {
    const h = hostname().toLowerCase();
    for (const v of values()) expect(v.toLowerCase()).not.toContain(h);
  });
});
