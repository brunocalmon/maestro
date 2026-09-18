import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { project as freshProject } from "./helpers-spec-0022";
import { scriptFor, runScript } from "./helpers-spec-0023";

/** Writes the 4 traces `specsfy-setup` leaves behind (SPEC-0025, SPECSFY_SETUP_TRACES). */
function withSpecsfyTraces(root: string): void {
  mkdirSync(resolve(root, ".specsfy"), { recursive: true });
  writeFileSync(resolve(root, "PROJECT.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "STACK.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "RULES.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "USER-PROFILE.md"), "x\n");
}

/** Writes the trace `setup-matt-pocock-skills` leaves behind (SPEC-0025, AGENT_SKILLS_HEADING). */
function withAgentSkillsSection(root: string): void {
  writeFileSync(resolve(root, "AGENTS.md"), "## Agent skills\n\nfoo\n");
}

const promptEvent = (prompt: string, root: string) => ({ session_id: "s-test", prompt, cwd: root });

const chmodTargets: string[] = [];
afterEach(() => {
  // Restore permissions so the temp-dir cleanup that Vitest/OS performs later doesn't fail.
  for (const t of chmodTargets.splice(0)) {
    try {
      chmodSync(t, 0o755);
    } catch {
      // best effort
    }
  }
});

describe("AC-001 — bloqueio padrão quando nada está configurado", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("nega mensagem comum quando nenhum traço existe", () => {
    const root = freshProject();
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("explique este arquivo para mim", root), root);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/specsfy-setup/);
    expect(r.stderr).toMatch(/setup-matt-pocock-skills/);
  });
});

describe("AC-002 — comando exato /specsfy-setup passa", () => {
  // SPECSFY: US-001 FR-001 FR-002 AC-002
  it("permite a invocação exata de /specsfy-setup mesmo sem traços", () => {
    const root = freshProject();
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("/specsfy-setup", root), root);
    expect(r.status).toBe(0);
  });
});

describe("AC-003 — comando exato /setup-matt-pocock-skills passa", () => {
  // SPECSFY: US-001 FR-001 FR-002 AC-003
  it("permite a invocação exata de /setup-matt-pocock-skills mesmo sem traços", () => {
    const root = freshProject();
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("/setup-matt-pocock-skills", root), root);
    expect(r.status).toBe(0);
  });
});

describe("AC-004 — bloqueio parcial: specsfy ok, matt-pocock pendente", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-004
  it("continua bloqueando mensagem comum quando só specsfy-setup está completo", () => {
    const root = freshProject();
    withSpecsfyTraces(root);
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("segue com a tarefa", root), root);
    expect(r.status).toBe(2);
  });

  // SPECSFY: US-001 FR-001 AC-004
  it("libera /setup-matt-pocock-skills mesmo com specsfy-setup já completo", () => {
    const root = freshProject();
    withSpecsfyTraces(root);
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("/setup-matt-pocock-skills", root), root);
    expect(r.status).toBe(0);
  });
});

describe("AC-005 — liberado quando ambos configurados", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-005
  it("libera qualquer mensagem quando os dois traços estão completos", () => {
    const root = freshProject();
    withSpecsfyTraces(root);
    withAgentSkillsSection(root);
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("segue com a tarefa, já configuramos tudo", root), root);
    expect(r.status).toBe(0);
  });
});

describe("AC-006 — quase-match não conta como comando de setup", () => {
  // SPECSFY: US-001 FR-002 AC-006
  it("bloqueia mensagem que só menciona o comando no meio do texto", () => {
    const root = freshProject();
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("me explica o que /specsfy-setup faz antes de eu rodar", root), root);
    expect(r.status).toBe(2);
  });
});

describe("AC-007 — fail-open em erro de leitura genérico do ambiente", () => {
  // SPECSFY: US-001 FR-001 NFR-002 AC-007
  it("permite a mensagem quando a leitura do projeto falha por erro de ambiente, não por ausência real", () => {
    const root = freshProject();
    // AGENTS.md exists but as a directory: any `cat`/`grep` against it fails with a read error, not "not found".
    mkdirSync(resolve(root, "AGENTS.md"));
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("qualquer mensagem", root), root);
    expect(r.status).toBe(0);
  });
});

describe("AC-018 — fail-open quando AGENTS.md existe mas está ilegível", () => {
  // SPECSFY: NFR-002 AC-018
  it("permite a mensagem quando AGENTS.md tem permissão de leitura negada, sem confundir com ausência real", () => {
    const root = freshProject();
    withSpecsfyTraces(root);
    const agentsPath = resolve(root, "AGENTS.md");
    writeFileSync(agentsPath, "## Agent skills\n\nfoo\n");
    chmodSync(agentsPath, 0o000);
    chmodTargets.push(agentsPath);
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("qualquer mensagem", root), root);
    expect(r.status).toBe(0);
  });
});

describe("NFR-001 — checagem ao vivo custa menos de 50ms de execução de shell", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("nega uma mensagem comum em menos de 50ms de execução do script gerado", () => {
    const root = freshProject();
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("qualquer mensagem", root), root);
    expect(r.status).toBe(2);
    expect(r.ms).toBeLessThan(50);
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-005
  it("libera uma mensagem em projeto totalmente configurado em menos de 50ms", () => {
    const root = freshProject();
    withSpecsfyTraces(root);
    withAgentSkillsSection(root);
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("qualquer mensagem", root), root);
    expect(r.status).toBe(0);
    expect(r.ms).toBeLessThan(50);
  });
});

describe("AC-019 — fail-open quando .specsfy/ existe mas está ilegível", () => {
  // SPECSFY: NFR-002 AC-019
  it("permite a mensagem quando .specsfy/ tem permissão de leitura negada, sem confundir com ausência real", () => {
    const root = freshProject();
    withSpecsfyTraces(root);
    const specsfyDir = resolve(root, ".specsfy");
    chmodSync(specsfyDir, 0o000);
    chmodTargets.push(specsfyDir);
    const script = scriptFor("setup-gate");
    const r = runScript(script, promptEvent("qualquer mensagem", root), root);
    expect(r.status).toBe(0);
  });
});
