import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedSource } from "./trace-fixtures";

function traceWith(id: string): string {
  const root = project();
  runSetup({ env: detectEnvironment(root), root, write: true, trace: fixedSource(id) });
  return JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"))["trace"];
}

describe("AC-044 — the identifier comes from the given generator", () => {
  // TRACEABILITY: US-042 FR-043 AC-044
  it("the recorded value is exactly the generator's", () => {
    expect(traceWith("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  // TRACEABILITY: US-042 NFR-040 AC-044
  it("a different generator produces a different recorded value", () => {
    expect(traceWith("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")).toBe("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  });

  // TRACEABILITY: US-042 FR-043 NFR-040 AC-044
  it("injection replaces the real source completely", () => {
    const a = traceWith("cccccccccccccccccccccccccccccccc");
    const b = traceWith("cccccccccccccccccccccccccccccccc");
    expect(a).toBe(b);
  });
});
