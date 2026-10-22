import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "..", "package.json"), "utf8"));

describe("AC-001 — pacote e binários declaram o nome novo", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-001
  it("declara o pacote como @brunocalmon/maestro, com os binários maestro e maestro-mcp", () => {
    expect(pkg.name).toBe("@brunocalmon/maestro");
    expect(pkg.bin).toMatchObject({
      maestro: expect.any(String),
      "maestro-mcp": expect.any(String),
    });
  });
});

describe("AC-002 — binário antigo deixa de existir", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-002
  it("não declara mais os binários common-rules ou common-rules-mcp", () => {
    expect(pkg.bin).not.toHaveProperty("common-rules");
    expect(pkg.bin).not.toHaveProperty("common-rules-mcp");
  });
});

describe("AC-003 — nenhuma referência residual no código de produção", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-003
  it("grep por common-rules em src/, resources/, package.json e Dockerfile não encontra nada", () => {
    const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
    const root = resolve(__dirname, "..");
    let output = "";
    try {
      output = execFileSync(
        "grep",
        ["-r", "common-rules", "src/", "resources/", "package.json", "Dockerfile"],
        { cwd: root, encoding: "utf8" },
      );
    } catch (error) {
      const err = error as { status?: number; stdout?: string };
      if (err.status === 1) {
        output = "";
      } else {
        throw error;
      }
    }
    expect(output.trim()).toBe("");
  });
});
