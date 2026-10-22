import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(resolve(__dirname, "..", ".github", "workflows", "ci.yml"), "utf8");
const pkg = JSON.parse(readFileSync(resolve(__dirname, "..", "package.json"), "utf8"));

describe("AC-007 — o workflow declara a imagem como maestro", () => {
  // TRACEABILITY: US-001 FR-003 NFR-002 AC-007
  it("o job docker referencia maestro como nome de imagem", () => {
    expect(workflow).toMatch(/maestro/);
  });
});

describe("AC-008 — o workflow não referencia o repositório Docker Hub antigo", () => {
  // TRACEABILITY: US-001 FR-003 NFR-002 AC-008
  it("nenhuma ocorrência de common-rules-server no workflow", () => {
    expect(workflow).not.toMatch(/common-rules-server/);
  });
});

describe("AC-009 — package.json declara o repositório renomeado", () => {
  // TRACEABILITY: US-001 FR-003 AC-009
  it("repository.url referencia o repositório maestro", () => {
    expect(pkg.repository?.url ?? "").toMatch(/maestro/);
  });
});
