import { describe, it, expect } from "vitest";
import { resolveSource } from "../src/skills/source";

describe("AC-035 — a non-official source is refused", () => {
  // TRACEABILITY: US-022 FR-025 AC-035
  it("refuses more than one form of invalid source", () => {
    for (const source of ["https://example.invalid/skills", "../outside", "another/repo", ""]) {
      expect(resolveSource(source).ok).toBe(false);
    }
  });

  // TRACEABILITY: US-022 FR-025 AC-035
  it("explains that the source isn't recognized", () => {
    const r = resolveSource("another/repo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/unrecognized/i);
  });

  // TRACEABILITY: US-022 NFR-021 AC-035
  it("refuses non-text input, without throwing", () => {
    for (const v of [undefined, null, 42, {}]) expect(resolveSource(v).ok).toBe(false);
  });
});
