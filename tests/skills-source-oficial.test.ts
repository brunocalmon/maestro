import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveSource, OFFICIAL_SOURCE } from "../src/skills/source";
import { toRecordEntries, readLock } from "../src/skills/record";
import { projectWithSkills, writeLock, MATTPOCOCK_SET } from "./skills-fixtures";

describe("AC-034 — the source written in the record is the official one", () => {
  // TRACEABILITY: US-021 FR-025 AC-034
  it("the official source is accepted", () => {
    expect(resolveSource(OFFICIAL_SOURCE).ok).toBe(true);
  });

  // TRACEABILITY: US-021 FR-023 AC-034
  it("the record's entries carry the source read from the lockfile", () => {
    const root = projectWithSkills();
    writeLock(root, MATTPOCOCK_SET);
    const entries = toRecordEntries(readLock(root));
    expect(entries).toHaveLength(MATTPOCOCK_SET.length);
    for (const e of entries) expect(e.source).toBe(OFFICIAL_SOURCE);
  });

  // TRACEABILITY: US-021 FR-023 FR-025 AC-034
  it("no other source appears in the record", () => {
    const root = projectWithSkills();
    writeLock(root, MATTPOCOCK_SET);
    const raw = JSON.parse(readFileSync(join(root, "skills-lock.json"), "utf8"));
    const sources = new Set(Object.values<{ source: string }>(raw.skills).map((s) => s.source));
    expect([...sources]).toEqual([OFFICIAL_SOURCE]);
  });
});
