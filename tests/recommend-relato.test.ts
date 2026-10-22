import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backends, snapshot, BIG_SMALL_WINDOW, SMALL_BIG_WINDOW, countingReader, capacity } from "./recommend-fixtures";

const both = snapshot([BIG_SMALL_WINDOW, SMALL_BIG_WINDOW]);

describe("AC-013 — o relatório declara o tipo considerado", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-013
  it("nomeia o tipo e a janela mínima exigida", () => {
    const r = recommend(backends, both, capacity, {}, { name: "revisao", contextWindowMin: 100_000 }, countingReader([]));

    expect(r.report).toMatch(/revisao/);
    expect(r.report).toMatch(/100000/);
  });
});

describe("AC-014 — um override escapa do filtro", () => {
  // TRACEABILITY: US-001 FR-003 NFR-002 AC-014
  it("mantém o modelo escolhido à mão mesmo com janela insuficiente", () => {
    const r = recommend(
      backends,
      both,
      capacity,
      { localModel: "grande:14b" },
      { name: "revisao", contextWindowMin: 100_000 },
      countingReader([]),
    );

    expect(r.localModel).toBe("grande:14b");
    expect(r.localModelOverridden).toBe(true);
    expect(r.report).toMatch(/override/i);
  });
});
