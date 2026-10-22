import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

const hasUv = (): boolean => {
  try {
    execFileSync("which", ["uv"], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

describe("AC-116 — the Python bridge actually runs when approved", () => {
  // TRACEABILITY: US-072 FR-074 NFR-072 AC-116
  it("with code-review-graph absent from both sources and uv available, .venv-crg is really created", () => {
    if (!hasUv()) return;
    const root = project();
    runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      bridgeEnv: { localVenv: null, onPath: null, hasUv: true },
      // Disposable: without this, the real bridge would create .venv-crg
      // at the maestro package's own root (where `doctor.ts` actually
      // looks for it), polluting this repository as a side effect of
      // running the suite.
      bridgeCwd: root,
      approval: { source: fixedDecision(true) },
    });
    expect(existsSync(join(root, ".venv-crg"))).toBe(true);
  }, 120_000);
});
