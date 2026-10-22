import { describe, it, expect } from "vitest";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function project(): string {
  return mkdtempSync(join(tmpdir(), "cli-behavior-file-"));
}

describe("AC-005 — agy e codex recebem comportamento por arquivo temporário", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-005
  it("escreve o comportamento em AGENTS.md antes de chamar a função recebida", async () => {
    const { withTemporaryAgentsFile } = await import("../src/delegation/cli-behavior-file");
    const root = project();
    let contentDuringCall: string | null = null;

    const result = withTemporaryAgentsFile(root, "comportamento composto de teste", () => {
      contentDuringCall = readFileSync(resolve(root, "AGENTS.md"), "utf8");
      return "spawn ok";
    });

    expect(contentDuringCall).toBe("comportamento composto de teste");
    expect(result).toMatchObject({ ok: true });
  });
});

describe("AC-006 — o arquivo temporário é sempre removido", () => {
  // TRACEABILITY: US-001 FR-002 NFR-002 AC-006
  it("some depois, inclusive quando a função recebida lança", async () => {
    const { withTemporaryAgentsFile } = await import("../src/delegation/cli-behavior-file");
    const root = project();
    const path = resolve(root, "AGENTS.md");

    expect(() =>
      withTemporaryAgentsFile(root, "comportamento", () => {
        throw new Error("falha simulada do spawn");
      }),
    ).toThrow("falha simulada do spawn");

    expect(existsSync(path)).toBe(false);
  });
});

describe("AC-005 (terceiro caso) — não sobrescreve um AGENTS.md real", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-005
  it("chama a função recebida somente depois do arquivo escrito em disco, não antes", async () => {
    const { withTemporaryAgentsFile } = await import("../src/delegation/cli-behavior-file");
    const root = project();
    mkdirSync(root, { recursive: true });
    writeFileSync(resolve(root, "AGENTS.md"), "conteúdo real da pessoa");

    const result = withTemporaryAgentsFile(root, "comportamento temporário", () => "não deveria rodar");

    expect(result).toMatchObject({ ok: false });
    expect(readFileSync(resolve(root, "AGENTS.md"), "utf8")).toBe("conteúdo real da pessoa");
  });
});
