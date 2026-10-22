import { describe, it, expect } from "vitest";
import { renderPlan } from "../src/approval/render";
import { itemFake } from "./approval-command-fixtures";

describe("AC-110 — the full plan lists every dependency command", () => {
  // TRACEABILITY: US-071 FR-071 AC-110
  it("hooks, skills, Framework and the bridge, all pending, appear in the text and the document", () => {
    const hooks = [{ name: "guard-destructive", target: ".claude/settings.json", event: "PreToolUse" }];
    const commands = [
      itemFake("skills", "install skills from mattpocock", "node", ["cli.mjs", "add", "mattpocock/skills"]),
      itemFake("skills", "install skills", "node", ["skills", "add", "example-org/skills"]),
      itemFake("bridge", "install code-review-graph via uv", "uv", [
        "pip",
        "install",
        "--python",
        ".venv-crg",
        "code-review-graph==2.3.7",
      ]),
    ];
    const { text, document } = renderPlan(hooks, commands);

    expect(text).toContain("guard-destructive");
    for (const c of commands) expect(text).toContain(c.label);

    const doc = JSON.parse(document);
    expect(doc.items).toHaveLength(1);
    expect(doc.commands).toHaveLength(3);
  });
});
