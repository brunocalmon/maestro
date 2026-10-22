import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { readLock } from "../src/skills/record";
import { projectWithSkills, fakeExecutor } from "./skills-fixtures";

describe("AC-031 — installation is interrupted before finishing", () => {
  // TRACEABILITY: US-022 FR-020 AC-031
  it("reports that the set wasn't left installed", async () => {
    const root = projectWithSkills();
    const r = await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("error", root).fn });
    expect(r.isError).toBe(true);
    expect(r.installed).toEqual([]);
  });

  // TRACEABILITY: US-022 NFR-021 AC-031
  it("the record doesn't gain an entry for an incomplete set", async () => {
    const root = projectWithSkills();
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("error", root).fn });
    // The executor left a directory behind on purpose; the lockfile is what decides.
    expect(readLock(root)).toBeNull();
  });

  // TRACEABILITY: US-022 FR-020 NFR-021 AC-031
  it("partial doesn't pass as complete in the report", async () => {
    const root = projectWithSkills();
    const r = await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("error", root).fn });
    expect(r.report).not.toMatch(/installed successfully/i);
  });
});
