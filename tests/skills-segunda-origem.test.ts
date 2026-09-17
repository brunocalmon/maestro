import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { dualSourceExecutor, MATTPOCOCK_SET, SPECSFY_SET } from "./skills-fixtures";
import { mkdtempSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Clean disposable root, with no source preinstalled. */
function cleanRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "crs-sk2-"));
  writeFileSync(join(root, "package.json"), '{"name":"disposable"}\n');
  return root;
}

const skillsOf = (root: string) => readdirSync(join(root, ".agents", "skills")).sort();

describe("AC-020 — the two sources coexist", () => {
  // SPECSFY: US-020 FR-027 AC-020
  it("mattpocock/skills and promovaweb/specsfy coexist in .agents/skills/", async () => {
    const root = cleanRoot();
    const ex = dualSourceExecutor();
    await installSkills({ root, source: "mattpocock/skills", execute: ex.fn });
    await installSkills({ root, source: "promovaweb/specsfy", execute: ex.fn });
    const present = skillsOf(root);
    for (const n of MATTPOCOCK_SET) expect(present).toContain(n);
    for (const n of SPECSFY_SET) expect(present).toContain(n);
  });
});

describe("AC-037 — one source failing doesn't contaminate the other", () => {
  // SPECSFY: US-020 FR-020 FR-027 NFR-021 AC-037
  it("mattpocock fails, promovaweb/specsfy stays installed", async () => {
    const root = cleanRoot();
    const ex = dualSourceExecutor("mattpocock/skills");
    const failed = await installSkills({ root, source: "mattpocock/skills", execute: ex.fn });
    const succeeded = await installSkills({ root, source: "promovaweb/specsfy", execute: ex.fn });
    expect(failed.isError).toBe(true);
    expect(succeeded.isError).toBe(false);
    const present = skillsOf(root);
    for (const n of SPECSFY_SET) expect(present).toContain(n);
    for (const n of MATTPOCOCK_SET) expect(present).not.toContain(n);
  });
});
