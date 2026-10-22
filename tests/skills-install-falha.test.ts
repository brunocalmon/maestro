import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { projectWithSkills, fakeExecutor } from "./skills-fixtures";

describe("AC-028 — the official installer can't run", () => {
  const run = async () => {
    const root = projectWithSkills();
    return installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("absent", root).fn });
  };

  // TRACEABILITY: US-022 FR-020 AC-028
  it("the response states the set wasn't installed", async () => {
    const r = await run();
    expect(r.isError).toBe(true);
    expect(r.installed).toEqual([]);
  });

  // TRACEABILITY: US-022 NFR-021 AC-028
  it("doesn't claim success", async () => {
    expect((await run()).report).not.toMatch(/installed successfully|completed/i);
  });

  // TRACEABILITY: US-022 FR-020 NFR-021 AC-028
  it("the report names the cause", async () => {
    expect((await run()).report).toMatch(/installer|available/i);
  });
});
