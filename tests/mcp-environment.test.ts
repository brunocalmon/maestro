import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { fileTree, disposableProject } from "./mcp-fixtures";

const saved = process.env["CLAUDE_PROJECT_DIR"];
afterEach(() => {
  if (saved === undefined) delete process.env["CLAUDE_PROJECT_DIR"];
  else process.env["CLAUDE_PROJECT_DIR"] = saved;
});

describe("AC-008 — project environment variables don't influence the write", () => {
  // TRACEABILITY: US-002 FR-002 AC-008
  it("writes to the root given to the tool", async () => {
    const fromEnv = disposableProject("crs-env-");
    const target = disposableProject("crs-target-");
    process.env["CLAUDE_PROJECT_DIR"] = fromEnv;
    await executeSetup({ project_root: target });
    expect(existsSync(join(target, ".maestro", "install.json"))).toBe(true);
  });

  // TRACEABILITY: US-002 NFR-001 AC-008
  it("leaves the project pointed to by the environment untouched", async () => {
    const fromEnv = disposableProject("crs-env-");
    const target = disposableProject("crs-target-");
    process.env["CLAUDE_PROJECT_DIR"] = fromEnv;
    const before = fileTree(fromEnv);
    await executeSetup({ project_root: target });
    expect(fileTree(fromEnv)).toEqual(before);
  });

  // TRACEABILITY: US-002 NFR-003 AC-008
  it("refuses when only the environment points at a project and the tool gets no root", async () => {
    process.env["CLAUDE_PROJECT_DIR"] = disposableProject("crs-env-");
    expect((await executeSetup({})).isError).toBe(true);
  });
});
