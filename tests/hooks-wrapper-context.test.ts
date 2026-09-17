import { describe, it, expect } from "vitest";
import { project, syntheticHook } from "./helpers-spec-0022";
import { scriptFor, runScript, CTX_EXECUTE } from "./helpers-spec-0023";

describe("AC-023 — preâmbulo expõe HOOK_TOOL e o wrapper suporta context", () => {
  // SPECSFY: FR-001 FR-004 NFR-002 AC-023
  it("fragmento com context= emite o JSON de contexto e vê o tool_name", () => {
    const root = project();
    const hook = syntheticHook(
      "kind: hook\nname: context-probe\nevent: before-tool\ntools: Grep|Glob",
      "\n## Script\n\n```sh\ncontext=\"dica para $HOOK_TOOL\"\n```\n",
    );
    const r = runScript(scriptFor(hook), { session_id: "s", tool_name: "Grep", tool_input: { pattern: "x" } }, root);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout) as { hookSpecificOutput: { hookEventName: string; additionalContext: string } };
    expect(out.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(out.hookSpecificOutput.additionalContext).toBe("dica para Grep");

    // Sem context, nada em stdout; e HOOK_COMMAND vem do campo `code` quando a linguagem é shell.
    const echo = syntheticHook(
      "kind: hook\nname: command-probe\nevent: before-tool",
      "\n## Script\n\n```sh\nif [ \"$HOOK_COMMAND\" = \"echo hi\" ]; then context=\"ok:$HOOK_TOOL\"; fi\n```\n",
    );
    const viaCtx = runScript(scriptFor(echo), { session_id: "s", tool_name: CTX_EXECUTE, tool_input: { language: "shell", code: "echo hi" } }, root);
    expect(JSON.parse(viaCtx.stdout).hookSpecificOutput.additionalContext).toBe(`ok:${CTX_EXECUTE}`);
    const silent = runScript(scriptFor(echo), { session_id: "s", tool_name: "Bash", tool_input: { command: "ls" } }, root);
    expect(silent.stdout).toBe("");
  });
});
