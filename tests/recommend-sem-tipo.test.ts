import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backends, snapshot, BIG_SMALL_WINDOW, SMALL_BIG_WINDOW, countingReader, capacity } from "./recommend-fixtures";

const both = snapshot([BIG_SMALL_WINDOW, SMALL_BIG_WINDOW]);

describe("AC-010 — sem tipo, o comportamento é o de hoje", () => {
  // TRACEABILITY: US-001 FR-004 NFR-002 AC-010
  it("escolhe o maior que cabe e declara a ausência de tipo", () => {
    const r = recommend(backends, both, capacity, {}, undefined, countingReader([]));

    expect(r.localModel).toBe("grande:14b");
    expect(r.report).toMatch(/no task type|nenhum tipo/i);
  });
});

describe("AC-011 — sem tipo, nenhuma janela é consultada", () => {
  // TRACEABILITY: US-001 FR-001 FR-004 NFR-001 AC-011
  it("o leitor não é chamado quando nenhum tipo é informado", () => {
    const asked: string[] = [];
    recommend(backends, both, capacity, {}, undefined, countingReader(asked));

    expect(asked).toEqual([]);
  });
});

describe("AC-012 — a janela só é consultada para quem passou na memória", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-012
  it("modelo que não cabe na memória não tem a janela consultada", () => {
    const asked: string[] = [];
    const tight = { freeBytes: 6 * 1024 ** 3, totalBytes: 16 * 1024 ** 3 } as const;

    recommend(backends, both, tight, {}, { name: "revisao", contextWindowMin: 100_000 }, countingReader(asked));

    expect(asked).toEqual(["medio:8b"]);
  });
});
