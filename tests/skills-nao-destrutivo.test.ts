import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { installSkills } from "../src/skills/install";
import { readLock, toRecordEntries, reportSkills } from "../src/skills/record";
import { fileTree, projectWithSkills, fakeExecutor, outsideProject, MATTPOCOCK_SET } from "./skills-fixtures";

describe("AC-032 — refusal, conflict and rerun preserve what exists", () => {
  // SPECSFY: US-020 FR-026 NFR-020 AC-032
  it("a conflict refusal deletes nothing", async () => {
    const root = projectWithSkills();
    const name = MATTPOCOCK_SET[0]!;
    mkdirSync(join(root, ".agents", "skills", name), { recursive: true });
    writeFileSync(join(root, ".agents", "skills", name, "SKILL.md"), "preexisting\n");
    const before = fileTree(root);
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    for (const path of before) expect(fileTree(root)).toContain(path);
  });

  // SPECSFY: US-020 FR-021 NFR-020 AC-032
  it("rerunning deletes nothing", async () => {
    const root = projectWithSkills();
    const opts = { root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn };
    await installSkills(opts);
    const middle = fileTree(root);
    await installSkills({ ...opts, previous: toRecordEntries(readLock(root)) });
    for (const path of middle) expect(fileTree(root)).toContain(path);
  });

  // SPECSFY: US-020 FR-022 NFR-022 AC-032
  it("nothing outside the project root was touched on any path", async () => {
    const root = projectWithSkills();
    const neighbor = projectWithSkills("crs-neighbor-");
    const beforeNeighbor = fileTree(neighbor);
    const beforeOutside = outsideProject();
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    reportSkills(root);
    expect(fileTree(neighbor)).toEqual(beforeNeighbor);
    expect(outsideProject()).toEqual(beforeOutside);
  });
});
