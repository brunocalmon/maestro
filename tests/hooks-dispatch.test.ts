import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { translateForClaudeCode } from "../src/hooks/claude-code";
import { syntheticHook, executable } from "./helpers-spec-0022";

describe("AC-012 — hook de despacho recebe stdin íntegro", () => {
  // SPECSFY: US-003 FR-005 AC-012
  it("o command é o binário direto e o JSON chega inalterado", () => {
    const bin = executable("echo-stdin", "cat");
    const hook = syntheticHook(`kind: hook\nname: echo-stdin\nevent: before-shell\nraw_command: ${bin} hook x`);
    const t = translateForClaudeCode(hook);
    expect(t.command).not.toContain("HOOK_INPUT=$(cat)");
    expect(t.command).not.toContain("hook fragment");
    const input = JSON.stringify({ tool_name: "Read", tool_input: { file_path: "/tmp/a" } });
    const r = spawnSync("sh", ["-c", t.command], { input, encoding: "utf8", timeout: 10_000 });
    expect(r.stdout).toContain(input);
  });
});

describe("AC-013 — exit code e stderr do binário são propagados", () => {
  // SPECSFY: US-003 FR-005 AC-013
  it("exit 2 e a mensagem do binário chegam ao Claude Code", () => {
    const bin = executable("fail-two", 'echo "bloqueado pelo binário" >&2; exit 2');
    const hook = syntheticHook(`kind: hook\nname: fail-two\nevent: before-shell\nraw_command: ${bin}`);
    const t = translateForClaudeCode(hook);
    const r = spawnSync("sh", ["-c", t.command], { input: "{}", encoding: "utf8", timeout: 10_000 });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("bloqueado pelo binário");
  });
});
