import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { fileTree, projectWithSkills, fakeExecutor, outsideProject } from "./skills-fixtures";

describe("AC-022 — nothing is written outside the root", () => {
  // TRACEABILITY: US-020 FR-022 AC-022
  it("the user's directory stays the same, including where the global form would write", async () => {
    const root = projectWithSkills();
    const before = outsideProject();
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    expect(outsideProject()).toEqual(before);
  });

  // TRACEABILITY: US-020 NFR-022 AC-022
  it("files only appear inside the project", async () => {
    const root = projectWithSkills();
    const neighbor = projectWithSkills("crs-neighbor-");
    const beforeNeighbor = fileTree(neighbor);
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    expect(fileTree(neighbor)).toEqual(beforeNeighbor);
  });

  // TRACEABILITY: US-020 FR-022 NFR-022 AC-022
  it("the invocation never builds the global form", async () => {
    const root = projectWithSkills();
    const ex = fakeExecutor("success", root);
    await installSkills({ root, source: "mattpocock/skills", execute: ex.fn });
    for (const args of ex.calls) {
      expect(args).not.toContain("-g");
      expect(args).not.toContain("--global");
    }
  });
});
