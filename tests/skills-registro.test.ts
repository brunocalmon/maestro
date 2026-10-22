import { describe, it, expect } from "vitest";
import { readLock, toRecordEntries } from "../src/skills/record";
import { projectWithSkills, writeLock, MATTPOCOCK_SET } from "./skills-fixtures";

describe("AC-023 — each set appears with its provenance", () => {
  const prepare = () => {
    const root = projectWithSkills();
    writeLock(root, MATTPOCOCK_SET);
    return root;
  };

  // TRACEABILITY: US-021 FR-023 AC-023
  it("each installed set appears named", () => {
    const names = toRecordEntries(readLock(prepare())).map((e) => e.name).sort();
    expect(names).toEqual([...MATTPOCOCK_SET].sort());
  });

  // TRACEABILITY: US-021 FR-023 AC-023
  it("carries the source it came from", () => {
    for (const e of toRecordEntries(readLock(prepare()))) expect(e.source).toBe("mattpocock/skills");
  });

  // TRACEABILITY: US-021 FR-023 AC-023
  it("carries the provenance read from the lockfile, without recomputing", () => {
    for (const e of toRecordEntries(readLock(prepare()))) {
      expect(e.computedHash).toBe(`hash-${e.name}`);
      expect(e.skillPath).toContain(e.name);
    }
  });
});
