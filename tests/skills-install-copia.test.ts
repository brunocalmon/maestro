import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { inspectSkills } from "../src/skills/inventory";
import { projectWithSkills, fakeExecutor } from "./skills-fixtures";

describe("AC-021 — no installed entry is a symlink", () => {
  // TRACEABILITY: US-020 FR-021 AC-021
  it("the inventory finds no link at any level", async () => {
    const root = projectWithSkills();
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    expect(inspectSkills(root).symlinks).toEqual([]);
  });

  // TRACEABILITY: US-020 NFR-022 AC-021
  it("the content the agent reads lives inside the project", async () => {
    const root = projectWithSkills();
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    const r = inspectSkills(root);
    expect(r.ok).toBe(true);
    for (const d of r.dirs) expect(d.startsWith("/")).toBe(false);
  });

  // TRACEABILITY: US-020 FR-021 AC-021
  it("the invocation explicitly requests copy, instead of accepting the default", async () => {
    const root = projectWithSkills();
    const ex = fakeExecutor("success", root);
    await installSkills({ root, source: "mattpocock/skills", execute: ex.fn });
    expect((ex.calls.at(0) ?? []).includes("--copy")).toBe(true);
  });
});
