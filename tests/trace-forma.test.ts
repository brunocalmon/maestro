import { describe, it, expect } from "vitest";
import { generateId, TRACE_ID_LENGTH } from "../src/telemetry/trace";

describe("AC-054 — the produced value has a predictable shape", () => {
  // TRACEABILITY: US-042 FR-040 AC-054
  it("has a fixed length", () => {
    for (let i = 0; i < 50; i++) expect(generateId().length).toBe(TRACE_ID_LENGTH);
  });

  // TRACEABILITY: US-042 NFR-041 AC-054
  it("uses only hex characters", () => {
    for (let i = 0; i < 50; i++) expect(generateId()).toMatch(/^[0-9a-f]+$/);
  });

  // TRACEABILITY: US-042 FR-040 NFR-041 AC-054
  it("the declared length is what the implementation produces", () => {
    expect(TRACE_ID_LENGTH).toBeGreaterThanOrEqual(16);
    expect(generateId().length).toBe(TRACE_ID_LENGTH);
  });
});
