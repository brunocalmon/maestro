import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";

const capacity = { totalBytes: 16_000_000_000, freeBytes: 8_000_000_000 };

describe("AC-097 — the report always names \"local model\", present or absent", () => {
  // The real CLI's own e2e test (models-recommend-real.test.ts) caught this
  // on a machine with no ollama installed — every dev machine used until
  // then had it, so the absent branch had never actually run.
  // TRACEABILITY: US-033 FR-037 NFR-035 AC-097
  it("names \"local model\" when ollama itself isn't installed", () => {
    const r = recommend([], { present: false, models: [] }, capacity);
    expect(r.report).toMatch(/local model/i);
  });

  // TRACEABILITY: US-033 FR-037 NFR-035 AC-097
  it("names \"local model\" when ollama is installed but nothing fits", () => {
    const r = recommend(
      [],
      { present: true, models: [{ name: "huge", sizeBytes: capacity.freeBytes + 1 }] },
      capacity,
    );
    expect(r.report).toMatch(/local model/i);
    expect(r.localModel).toBeNull();
  });

  // TRACEABILITY: US-033 FR-037 NFR-035 AC-097
  it("names \"local model\" when one fits", () => {
    const r = recommend(
      [],
      { present: true, models: [{ name: "small", sizeBytes: 1_000 }] },
      capacity,
    );
    expect(r.report).toMatch(/local model/i);
    expect(r.localModel).toBe("small");
  });
});
