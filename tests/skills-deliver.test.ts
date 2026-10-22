import { describe, it, expect } from "vitest";
import { readBundledSkill, deliverBundledSkill } from "../src/skills/deliver";

function writeEnvFake() {
  const files: Record<string, string> = {};
  return { files, write: (path: string, content: string) => { files[path] = content; } };
}

describe("maestro-extension-creator ships as a bundled skill", () => {
  // TRACEABILITY: US-080 US-082 FR-088 AC-140
  it("reads the real SKILL.md from resources/skills/", () => {
    const files = readBundledSkill("maestro-extension-creator");
    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("SKILL.md");
    expect(files[0].content).toMatch(/maestro extension create/);
  });

  // TRACEABILITY: US-080 US-082 FR-088 AC-140
  it("returns an empty list for a skill that isn't bundled", () => {
    expect(readBundledSkill("does-not-exist")).toEqual([]);
  });

  // TRACEABILITY: US-080 US-082 FR-088 AC-140
  it("delivers every file into every target directory", () => {
    const env = writeEnvFake();
    const files = [{ relativePath: "SKILL.md", content: "# hello" }];
    const written = deliverBundledSkill(files, "my-skill", [".claude/skills", ".agents/skills"], env);

    expect(written).toEqual([".claude/skills/my-skill/SKILL.md", ".agents/skills/my-skill/SKILL.md"]);
    expect(env.files[".claude/skills/my-skill/SKILL.md"]).toBe("# hello");
    expect(env.files[".agents/skills/my-skill/SKILL.md"]).toBe("# hello");
  });
});
