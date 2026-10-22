import { describe, it, expect } from "vitest";
import { executeSetup } from "../src/mcp/tool";
import { fileTree, disposableProject } from "./mcp-fixtures";

describe("AC-002 — invoking without project_root writes nothing", () => {
  // TRACEABILITY: US-002 FR-002 AC-002
  it("returns an error", async () => {
    expect((await executeSetup({})).isError).toBe(true);
  });

  // TRACEABILITY: US-002 FR-006 AC-002
  it("names the missing parameter", async () => {
    const r = await executeSetup({});
    expect(JSON.stringify(r.content)).toMatch(/project_root/);
  });

  // TRACEABILITY: US-002 NFR-001 AC-002
  it("creates no file anywhere", async () => {
    const neighbor = disposableProject();
    const before = fileTree(neighbor);
    await executeSetup({});
    expect(fileTree(neighbor)).toEqual(before);
  });
});
