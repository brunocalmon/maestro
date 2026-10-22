import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { fileTree, disposableProject } from "./mcp-fixtures";

const original = process.cwd();
afterEach(() => process.chdir(original));

describe("AC-005 — the process's working directory points elsewhere", () => {
  // TRACEABILITY: US-002 FR-002 AC-005
  it("files appear inside the given project", async () => {
    const foreign = disposableProject("crs-foreign-");
    const target = disposableProject("crs-target-");
    process.chdir(foreign);
    await executeSetup({ project_root: target });
    expect(existsSync(join(target, ".maestro", "install.json"))).toBe(true);
  });

  // TRACEABILITY: US-002 NFR-001 AC-005
  it("nothing is created in the process's working directory", async () => {
    const foreign = disposableProject("crs-foreign-");
    const target = disposableProject("crs-target-");
    process.chdir(foreign);
    const before = fileTree(foreign);
    await executeSetup({ project_root: target });
    expect(fileTree(foreign)).toEqual(before);
  });

  // TRACEABILITY: US-002 NFR-003 AC-005
  it("the result doesn't change when the working directory changes", async () => {
    const targetA = disposableProject("crs-a-");
    const targetB = disposableProject("crs-b-");
    process.chdir(disposableProject("crs-foreign-"));
    const a = await executeSetup({ project_root: targetA });
    process.chdir(original);
    const b = await executeSetup({ project_root: targetB });
    expect(a.structuredContent?.hooks.map((h) => h.name)).toEqual(b.structuredContent?.hooks.map((h) => h.name));
  });
});
