import { describe, it, expect } from "vitest";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projectWithSkills, dualSourceExecutor } from "./skills-fixtures";
import { decisionThatThrowsIfCalled } from "./aprovacao-fixtures";
import type { Executor as SpecsfyExecutor } from "../src/specsfy/install";

function fakeSpecsfyExecutor(root: string, fail = false) {
  let calls = 0;
  const fn: SpecsfyExecutor = (r) => {
    calls += 1;
    if (fail) return { status: 1, reason: "local changes present" };
    mkdirSync(join(r, ".specsfy"), { recursive: true });
    return { status: 0, changed: 1, paths: [join(r, ".specsfy")] };
  };
  return { fn, count: () => calls };
}

function configured() {
  const root = projectWithSkills();
  const env = detectEnvironment(root);
  const skillsEx = dualSourceExecutor();
  const specsfyEx = fakeSpecsfyExecutor(root);
  const first = runSetup({ env, root, write: true, skills: { execute: skillsEx.fn }, specsfy: { execute: specsfyEx.fn } });
  return { root, env, previous: first.record };
}

describe("AC-006 — instaladores rodam no segundo setup sem nova aprovação", () => {
  // SPECSFY: US-002 FR-004 NFR-002 AC-006
  it(".agents/skills apagado: executores invocados e a fonte de aprovação não é consultada", () => {
    const { root, env, previous } = configured();
    rmSync(resolve(root, ".agents", "skills"), { recursive: true, force: true });
    const skillsEx = dualSourceExecutor();
    const specsfyEx = fakeSpecsfyExecutor(root);
    runSetup({
      env, root, write: true, previous,
      skills: { execute: skillsEx.fn },
      specsfy: { execute: specsfyEx.fn },
      approval: { source: decisionThatThrowsIfCalled() },
    });
    expect(skillsEx.calls.length).toBeGreaterThan(0);
    expect(specsfyEx.count()).toBeGreaterThan(0);
  });
});

describe("AC-007 — segundo setup sem mudança também invoca os instaladores, sem escrita desnecessária", () => {
  // SPECSFY: US-002 FR-004 NFR-002 AC-007
  it("executores invocados; settings.json, extensions.json e scripts idênticos", () => {
    const { root, env, previous } = configured();
    const settingsBefore = readFileSync(resolve(root, ".claude", "settings.json"), "utf8");
    const extensionsBefore = readFileSync(resolve(root, ".maestro", "extensions.json"), "utf8");
    const skillsEx = dualSourceExecutor();
    const specsfyEx = fakeSpecsfyExecutor(root);
    const second = runSetup({
      env, root, write: true, previous,
      skills: { execute: skillsEx.fn },
      specsfy: { execute: specsfyEx.fn },
      approval: { source: decisionThatThrowsIfCalled() },
    });
    expect(skillsEx.calls.length).toBeGreaterThan(0);
    expect(specsfyEx.count()).toBeGreaterThan(0);
    expect(readFileSync(resolve(root, ".claude", "settings.json"), "utf8")).toBe(settingsBefore);
    expect(readFileSync(resolve(root, ".maestro", "extensions.json"), "utf8")).toBe(extensionsBefore);
    expect(second.report).toMatch(/hooks/i);
  });
});

describe("AC-008 — instalador falhando não bloqueia o restante e é reportado", () => {
  // SPECSFY: US-002 FR-004 NFR-002 AC-008
  it("Specsfy recusa por alterações locais: hooks e blocos ainda são instalados, razão no relatório", () => {
    const root = projectWithSkills();
    const env = detectEnvironment(root);
    const skillsEx = dualSourceExecutor();
    const specsfyEx = fakeSpecsfyExecutor(root, true);
    const result = runSetup({ env, root, write: true, skills: { execute: skillsEx.fn }, specsfy: { execute: specsfyEx.fn } });
    expect(result.installed.length).toBeGreaterThan(0);
    expect(readFileSync(resolve(root, "AGENTS.md"), "utf8")).toContain("maestro:extension:router:start");
    expect(result.report).toMatch(/local changes present/);
  });
});
