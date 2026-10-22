import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backends, snapshot, BIG_SMALL_WINDOW, SMALL_BIG_WINDOW, countingReader, capacity } from "./recommend-fixtures";

const both = snapshot([BIG_SMALL_WINDOW, SMALL_BIG_WINDOW]);

describe("AC-007 — janela insuficiente descarta o modelo", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-007
  it("o maior que cabe perde para o de janela suficiente", () => {
    const r = recommend(backends, both, capacity, {}, { name: "revisao", contextWindowMin: 100_000 }, countingReader([]));

    expect(r.localModel).toBe("medio:8b");
  });
});

describe("AC-008 — entre os viáveis, o maior continua vencendo", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-008
  it("dois modelos satisfazem a janela e o maior é escolhido", () => {
    const r = recommend(backends, both, capacity, {}, { name: "ajuste", contextWindowMin: 4_000 }, countingReader([]));

    expect(r.localModel).toBe("grande:14b");
  });
});

describe("AC-009 — nenhum viável declara o motivo", () => {
  // TRACEABILITY: US-001 FR-003 FR-004 NFR-002 AC-009
  it("nenhum modelo alcança o mínimo: sem recomendação, com motivo no relatório", () => {
    const r = recommend(backends, both, capacity, {}, { name: "gigante", contextWindowMin: 1_000_000 }, countingReader([]));

    expect(r.localModel).toBeNull();
    expect(r.report).toMatch(/1000000|1_000_000|1000000/);
    expect(r.report).toMatch(/131072/);
  });
});
