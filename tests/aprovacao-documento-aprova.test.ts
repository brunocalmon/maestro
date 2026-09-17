import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project } from "./aprovacao-fixtures";

describe("AC-065 — the document authorizes the run", () => {
  const run = (root: string) => runSetup({
    env: detectEnvironment(root), root, write: true,
    approval: { context: { hasTerminal: () => false }, stdin: { read: () => '{"approved": true}' } },
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("the document is actually read before deciding", () => {
    const root = project();
    let readCount = 0;
    runSetup({
      env: detectEnvironment(root), root, write: true,
      approval: { context: { hasTerminal: () => false }, stdin: { read: () => { readCount += 1; return '{"approved": true}'; } } },
    });
    expect(readCount).toBe(1);
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("the run happens", () => {
    const root = project();
    expect(run(root).exitCode).toBe(0);
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("the expected files exist", () => {
    const root = project();
    run(root);
    expect(existsSync(join(root, ".claude", "settings.json"))).toBe(true);
    expect(existsSync(join(root, ".maestro", "install.json"))).toBe(true);
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("the number of installed hooks is as expected", () => {
    const root = project();
    expect(run(root).installed.length).toBe(installedHookCount());
  });
});
