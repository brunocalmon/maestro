import { describe, it, expect } from "vitest";
import { executeSetup } from "../src/mcp/tool";
import { fileTree, emptyDirectory } from "./mcp-fixtures";

describe("AC-003 — a directory with no project marker is refused", () => {
  // TRACEABILITY: US-002 FR-003 AC-003
  it("returns an error", async () => {
    expect((await executeSetup({ project_root: emptyDirectory() })).isError).toBe(true);
  });

  // TRACEABILITY: US-002 FR-006 AC-003
  it("explains that the path doesn't look like a project", async () => {
    const r = await executeSetup({ project_root: emptyDirectory() });
    expect(JSON.stringify(r.content)).toMatch(/project/i);
  });

  // TRACEABILITY: US-002 NFR-001 AC-003
  it("creates no file in that directory", async () => {
    const empty = emptyDirectory();
    await executeSetup({ project_root: empty });
    expect(fileTree(empty)).toEqual([]);
  });
});
