import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(__dirname, "..", "resources", "skills", "maestro-extension-creator", "SKILL.md");

describe("AC-138 — the facade skill never writes a file directly", () => {
  // TRACEABILITY: US-080 US-082 FR-080 FR-086 FR-087 NFR-083 AC-138
  it("the skill interviews the person and only issues the CLI command, with no write logic", () => {
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf8");

    expect(content).toMatch(/maestro extension create/);
    expect(content).not.toMatch(/writeFileSync|fs\.write|JSON\.stringify/);
  });
});
