import { describe, it, expect } from "vitest";
import { resolveSource, OFFICIAL_SOURCE } from "../src/skills/source";
import { fileTree, projectWithSkills } from "./skills-fixtures";

describe("AC-026 — the third-party npm package isn't accepted", () => {
  // TRACEABILITY: US-022 FR-025 AC-026
  it("refuses the npm registry republish", () => {
    expect(resolveSource("mattpocock-skills").ok).toBe(false);
  });

  // TRACEABILITY: US-022 FR-020 FR-025 AC-026
  it("names the official source in the explanation", () => {
    const r = resolveSource("mattpocock-skills");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain(OFFICIAL_SOURCE);
  });

  // TRACEABILITY: US-022 FR-025 AC-026
  it("nothing is installed when refusing", () => {
    const root = projectWithSkills();
    const before = fileTree(root);
    resolveSource("mattpocock-skills");
    expect(fileTree(root)).toEqual(before);
  });
});
