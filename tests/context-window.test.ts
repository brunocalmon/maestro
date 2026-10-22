import { describe, it, expect } from "vitest";

/** Saída real de `ollama show cogito:14b` nesta máquina, capturada na descoberta (R-001). */
const REAL_OUTPUT = `  Model
    architecture        qwen2     
    parameters          14.8B     
    context length      131072    
    embedding length    5120      
    quantization        Q4_K_M    

  Capabilities
    completion    
    tools         
`;

describe("AC-001 — a janela é lida do modelo, localmente", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-001
  it("extrai o número declarado como context length", async () => {
    const { parseContextLength } = await import("../src/models/context-window");
    expect(parseContextLength(REAL_OUTPUT)).toBe(131072);
  });
});

describe("AC-002 — saída sem janela não vira zero", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-002
  it("devolve ausência declarada, não o número zero", async () => {
    const { parseContextLength } = await import("../src/models/context-window");
    const without = REAL_OUTPUT.split("\n").filter((l) => !l.includes("context length")).join("\n");

    const result = parseContextLength(without);

    expect(result).toBeNull();
    expect(result).not.toBe(0);
  });
});

describe("AC-003 — falha na leitura é ausência, não exceção", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-003
  it("um comando que falha devolve null sem lançar", async () => {
    const { contextWindowReader } = await import("../src/models/context-window");
    const reader = contextWindowReader({
      show: () => {
        throw new Error("ollama: model not found");
      },
    });

    expect(() => reader("sumiu:7b")).not.toThrow();
    expect(reader("sumiu:7b")).toBeNull();
  });
});
