import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { readLock, toRecordEntries } from "../src/skills/record";
import { fileTree, projectWithSkills, fakeExecutor, MATTPOCOCK_SET } from "./skills-fixtures";

describe("AC-029 — the second run recognizes the state", () => {
  const twice = async () => {
    const root = projectWithSkills();
    const opts = { root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn };
    await installSkills(opts);
    const middle = fileTree(root);
    const second = await installSkills({ ...opts, previous: toRecordEntries(readLock(root)) });
    return { root, middle, second };
  };

  // TRACEABILITY: US-020 FR-023 AC-029
  it("the record keeps one entry per set", async () => {
    const { root } = await twice();
    const names = toRecordEntries(readLock(root)).map((e) => e.name);
    expect(new Set(names).size).toBe(MATTPOCOCK_SET.length);
    expect(names.length).toBe(MATTPOCOCK_SET.length);
  });

  // TRACEABILITY: US-020 NFR-020 AC-029
  it("no installed content was removed", async () => {
    const { root, middle } = await twice();
    for (const path of middle) expect(fileTree(root)).toContain(path);
  });

  // TRACEABILITY: US-020 FR-026 AC-029
  it("the second run isn't reported as a new install", async () => {
    const { second } = await twice();
    expect(second.changed).toBe(false);
  });
});
