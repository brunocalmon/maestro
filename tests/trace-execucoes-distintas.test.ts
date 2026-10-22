import { describe, it, expect } from "vitest";
import { generateId } from "../src/telemetry/trace";

describe("AC-045 — the real generator doesn't repeat values", () => {
  const many = () => Array.from({ length: 500 }, () => generateId());

  // TRACEABILITY: US-040 FR-040 AC-045
  it("no value repeats among them", () => {
    const v = many();
    expect(new Set(v).size).toBe(v.length);
  });

  // TRACEABILITY: US-040 NFR-041 AC-045
  it("none contains a file path", () => {
    for (const v of many()) expect(v).not.toMatch(/[/\\]/);
  });

  // TRACEABILITY: US-040 FR-040 NFR-041 AC-045
  it("two consecutive values differ", () => {
    expect(generateId()).not.toBe(generateId());
  });
});
