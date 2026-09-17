import { describe, it, expect } from "vitest";
import { project } from "./helpers-spec-0022";
import { scriptFor, runScript, shellEvent, CTX_EXECUTE } from "./helpers-spec-0023";

const BUILD = "node .claude/skills/specsfy-documentator/scripts/build_documentation.mjs --project .";

describe("AC-017 — guard-docs bloqueia o build sem --check", () => {
  // SPECSFY: US-005 FR-008 NFR-002 AC-017
  it("exit 2 com mensagem citando --check e MAESTRO_ALLOW_DOCS_BUILD=1", () => {
    const root = project();
    const r = runScript(scriptFor("guard-docs"), shellEvent("Bash", BUILD), root);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("--check");
    expect(r.stderr).toContain("MAESTRO_ALLOW_DOCS_BUILD=1");
  });
});

describe("AC-018 — --check e autorização explícita passam", () => {
  // SPECSFY: US-005 FR-008 NFR-002 AC-018
  it("check e variável no início da linha", () => {
    const root = project();
    const script = scriptFor("guard-docs");
    expect(runScript(script, shellEvent("Bash", `${BUILD} --check`), root).status).toBe(0);
    expect(runScript(script, shellEvent("Bash", `MAESTRO_ALLOW_DOCS_BUILD=1 ${BUILD}`), root).status).toBe(0);
    expect(runScript(script, shellEvent("Bash", "ls docs"), root).status).toBe(0);
  });
});

describe("AC-019 — guard-docs também cobre ferramentas MCP de shell", () => {
  // SPECSFY: US-005 FR-008 FR-002 AC-019
  it("build via ctx_execute shell é bloqueado", () => {
    const root = project();
    const r = runScript(scriptFor("guard-docs"), shellEvent(CTX_EXECUTE, "node x/build_documentation.mjs --project ."), root);
    expect(r.status).toBe(2);
  });
});
