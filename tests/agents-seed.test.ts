import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

const ROOT = resolve(__dirname, "..");

function setup(root: string) {
  return runSetup({
    env: detectEnvironment(root),
    root,
    write: true,
    approval: { source: fixedDecision(true) },
  });
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe("AC-004 — os arquivos de fábrica existem fisicamente", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-004
  it("cria description.md e behavior.md do maestro com conteúdo", () => {
    const root = project();
    setup(root);

    for (const file of ["description.md", "behavior.md"]) {
      const path = join(root, ".maestro", "subagents", "maestro", file);
      expect(existsSync(path), path).toBe(true);
      expect(readFileSync(path, "utf8").trim().length).toBeGreaterThan(0);
    }
  });
});

describe("AC-005 — nenhum comportamento padrão vive embutido no código", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-005
  it("o comportamento padrão vive em resources/, não como string em src/", () => {
    const resource = resolve(ROOT, "resources", "agents", "maestro", "behavior.md");
    expect(existsSync(resource)).toBe(true);

    const firstSentence = readFileSync(resource, "utf8").trim().split("\n").filter(Boolean)[0]!;
    const offenders = walk(resolve(ROOT, "src")).filter((f) =>
      readFileSync(f, "utf8").includes(firstSentence),
    );
    expect(offenders).toEqual([]);
  });
});

describe("AC-006 — a semeadura não apaga arquivo de comportamento já editado", () => {
  // TRACEABILITY: US-001 FR-002 NFR-002 AC-006
  it("preserva behavior.md editado à mão numa segunda execução", () => {
    const root = project();
    setup(root);

    const path = join(root, ".maestro", "subagents", "maestro", "behavior.md");
    writeFileSync(path, "# comportamento próprio da pessoa\n");

    const result = setup(root);

    expect(readFileSync(path, "utf8")).toBe("# comportamento próprio da pessoa\n");
    expect(result.report).not.toMatch(/diverg/i);
  });
});
