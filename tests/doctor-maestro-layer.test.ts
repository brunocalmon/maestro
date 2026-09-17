import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { inspectDependencies, defaultEnvironment } from "../src/doctor";
import { expectedLayout, assessConfiguration } from "../src/setup/layout";
import { diagnoseMaestro, diagnoseMaestroProject } from "../src/doctor/maestro";
import { claudeEnv, project as freshProject } from "./helpers-spec-0022";
import type { SubsystemResult } from "../src/doctor/subsystems";

const opts = { upstream: { contextModeHooksJson: null } };
const allOkSubsystems: SubsystemResult[] = [
  { name: "specsfy", status: "OK" },
  { name: "context-mode", status: "OK" },
  { name: "skills", status: "OK" },
  { name: "code-review-graph", status: "OK" },
];

function configuredProject(): string {
  const root = freshProject();
  mkdirSync(resolve(root, ".specsfy"), { recursive: true });
  writeFileSync(resolve(root, "PROJECT.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "STACK.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "RULES.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "USER-PROFILE.md"), "x\n");
  runSetup({ env: claudeEnv, root, write: true, ...opts });
  writeFileSync(resolve(root, "AGENTS.md"), `${readFileSync(resolve(root, "AGENTS.md"), "utf8")}\n## Agent skills\n\nfoo\n`);
  return root;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc.sort();
}
function hashTree(dir: string): string {
  const hash = createHash("sha256");
  for (const file of walk(dir)) {
    hash.update(file.slice(dir.length));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

describe("AC-012 — entrada legada e script ausente: FAIL hooks, exit 1", () => {
  // SPECSFY: US-003 FR-006 FR-008 AC-012
  it("relata as duas causas e o exit fica em 1", () => {
    const root = configuredProject();
    const settingsPath = resolve(root, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    settings.hooks.PreToolUse.push({
      matcher: "guard-secrets",
      hooks: [{ type: "command", command: "#!/usr/bin/env bash\n# >>> hook fragment\necho x\n# <<< hook fragment\nexit 0" }],
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    rmSync(resolve(root, ".maestro", "hooks", "guard-destructive.sh"));

    const assessment = assessConfiguration(root, "claude-code");
    expect(assessment.legacyHookEntries).toContain("guard-secrets");
    const findings = diagnoseMaestro(assessment);
    expect(findings.some((f) => f.level === "FAIL" && f.area === "hooks")).toBe(true);

    const report = inspectDependencies(
      defaultEnvironment(),
      root,
      undefined,
      undefined,
      undefined,
      () => allOkSubsystems,
      () => diagnoseMaestroProject(root),
    );
    expect(report.exitCode).toBe(1);
  });
});

describe("AC-013 — direção antiga e marcador sem par: FAIL; seção desconhecida: WARN", () => {
  // SPECSFY: US-003 FR-006 FR-007 FR-008 AC-013
  it("três desvios classificados corretamente", () => {
    const root = configuredProject();
    const claudePath = resolve(root, "CLAUDE.md");
    const current = readFileSync(claudePath, "utf8");
    writeFileSync(
      claudePath,
      `${current}\n<!-- maestro:extension:router:start -->\n## maestro\nold direction\n<!-- maestro:extension:router:end -->\n<!-- common-rules:extension:router:start -->\n## common-rules\n\n## Minhas notas\n\nnotas humanas.\n`,
    );
    const assessment = assessConfiguration(root, "claude-code");
    expect(assessment.wrongDirectionBlocks).toContain("router");
    expect(assessment.unpairedMarkers.some((m) => m.includes("common-rules"))).toBe(true);
    expect(assessment.unknownSections.some((s) => s.includes("Minhas notas"))).toBe(true);

    const findings = diagnoseMaestro(assessment);
    expect(findings).toContainEqual(expect.objectContaining({ level: "FAIL", message: expect.stringContaining("router") }));
    expect(findings.some((f) => f.level === "FAIL" && f.message.includes("common-rules"))).toBe(true);
    expect(findings).toContainEqual(expect.objectContaining({ level: "WARN", message: expect.stringContaining("Minhas notas") }));
  });
});

describe("AC-014 — rastros ausentes são WARN com a skill a executar; exit 0", () => {
  // SPECSFY: US-003 FR-006 FR-008 NFR-001 AC-014
  it("sem PROJECT.md: WARN citando /specsfy-setup, exit 0", () => {
    const root = configuredProject();
    rmSync(resolve(root, "PROJECT.md"));
    const assessment = assessConfiguration(root, "claude-code");
    const findings = diagnoseMaestro(assessment);
    expect(findings.some((f) => f.level === "WARN" && f.message.includes("PROJECT.md") && f.message.includes("/specsfy-setup"))).toBe(true);
    expect(findings.every((f) => f.level !== "FAIL")).toBe(true);

    const report = inspectDependencies(
      defaultEnvironment(), root, undefined, undefined, undefined,
      () => allOkSubsystems,
      () => findings,
    );
    expect(report.exitCode).toBe(0);
  });
});

describe("AC-015 — projeção divergente e cobertura hook ↔ regra", () => {
  // SPECSFY: US-003 FR-006 FR-007 AC-015
  it("cópia editada: WARN; hook citado no fallback sem script: FAIL", () => {
    const root = configuredProject();
    mkdirSync(resolve(root, ".agents", "skills", "specsfy-specialist-x"), { recursive: true });
    writeFileSync(resolve(root, ".agents", "skills", "specsfy-specialist-x", "SKILL.md"), "---\nname: specsfy-specialist-x\n---\nv1\n");
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    writeFileSync(resolve(root, ".claude", "skills", "specsfy-specialist-x", "SKILL.md"), "edited by hand\n");

    rmSync(resolve(root, ".maestro", "hooks", "guard-docs.sh"));

    const assessment = assessConfiguration(root, "claude-code");
    expect(assessment.divergentProjections.map((p) => p.name)).toContain("specsfy-specialist-x");
    expect(assessment.uncoveredFallbackHooks.map((h) => h.name)).toContain("guard-docs");

    const findings = diagnoseMaestro(assessment);
    expect(findings.some((f) => f.level === "WARN" && f.message.includes("specsfy-specialist-x"))).toBe(true);
    expect(findings.some((f) => f.level === "FAIL" && f.message.includes("guard-docs"))).toBe(true);
  });
});

describe("AC-016 — layout esperado é a mesma função no setup e no doctor", () => {
  // SPECSFY: US-003 FR-007 NFR-001 AC-016
  it("logo após um setup, assessConfiguration não acusa nada de hooks/blocos/projeções", () => {
    const root = configuredProject();
    const assessment = assessConfiguration(root, "claude-code");
    expect(assessment.legacyHookEntries).toEqual([]);
    expect(assessment.missingHookScripts).toEqual([]);
    expect(assessment.wrongDirectionBlocks).toEqual([]);
    expect(assessment.missingBlocks).toEqual([]);
    expect(assessment.divergentProjections).toEqual([]);
    expect(assessment.uncoveredFallbackHooks).toEqual([]);
    // Pure: takes at most a target name, never a root — it cannot read install.json.
    expect(expectedLayout()).toEqual(expectedLayout());
    expect(expectedLayout.length).toBeLessThanOrEqual(1);
  });
});

describe("AC-017 — doctor nunca escreve", () => {
  // SPECSFY: US-003 FR-008 NFR-001 AC-017
  it("hash da raiz antes = hash depois, mesmo com todos os desvios", () => {
    const root = configuredProject();
    rmSync(resolve(root, "PROJECT.md"));
    writeFileSync(resolve(root, "CLAUDE.md"), `${readFileSync(resolve(root, "CLAUDE.md"), "utf8")}\n## Minhas notas\n\nx\n`);
    const before = hashTree(root);
    diagnoseMaestroProject(root);
    const after = hashTree(root);
    expect(after).toBe(before);
  });
});

describe("AC-018 — nível WARN não altera o exit; qualquer FAIL altera", () => {
  // SPECSFY: US-003 FR-008 NFR-002 AC-018
  it("só WARN: exit 0; com um FAIL: exit 1", () => {
    const root = configuredProject();
    writeFileSync(resolve(root, "CLAUDE.md"), `${readFileSync(resolve(root, "CLAUDE.md"), "utf8")}\n## Minhas notas\n\nx\n`);
    const warnOnly = inspectDependencies(
      defaultEnvironment(), root, undefined, undefined, undefined,
      () => allOkSubsystems,
      () => diagnoseMaestroProject(root),
    );
    expect(warnOnly.exitCode).toBe(0);

    rmSync(resolve(root, ".maestro", "hooks", "guard-destructive.sh"));
    const withFail = inspectDependencies(
      defaultEnvironment(), root, undefined, undefined, undefined,
      () => allOkSubsystems,
      () => diagnoseMaestroProject(root),
    );
    expect(withFail.exitCode).toBe(1);
  });
});


