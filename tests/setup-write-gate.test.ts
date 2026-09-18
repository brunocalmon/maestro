import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { project as freshProject, corpusHook, claudeEnv } from "./helpers-spec-0022";
import { antigravityAdapter } from "../src/targets/antigravity";
import { runSetup } from "../src/setup/run";

describe("AC-008 — target antigravity nunca bloqueia (setup-gate é skipped)", () => {
  // SPECSFY: US-001 FR-005 AC-008
  it("reporta setup-gate como skipped por evento on-prompt não suportado", () => {
    const { skipped, installed } = antigravityAdapter.formatHooks([corpusHook("setup-gate")]);
    expect(installed).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toMatchObject({ name: "setup-gate", event: "on-prompt" });
    expect(skipped[0]!.reason).toMatch(/on-prompt/);
  });
});

describe("AC-016 — setup-check nunca é rejeitado por evento no target antigravity", () => {
  // SPECSFY: FR-005 AC-016
  it("classifica setup-check (session-start) como installed, não skipped, ao contrário de setup-gate", () => {
    // `antigravityAdapter.settingsPath` is `null`, so `runSetup` never writes
    // ANY hook script for this target yet (pre-existing gap, out of scope
    // for SPEC-0026 — see AC-017 below). The guarantee this AC actually
    // covers is narrower: `setup-check`'s event is supported, so it is never
    // the reason a future antigravity delivery mechanism would drop it —
    // unlike `setup-gate`, which is unsupported by event, not by target gap.
    const { skipped, installed } = antigravityAdapter.formatHooks([corpusHook("setup-check")]);
    expect(skipped).toHaveLength(0);
    expect(installed.map((h) => h.name)).toContain("setup-check");
  });
});

describe("AC-017 — instalação no target antigravity nunca grava o hook de bloqueio", () => {
  // SPECSFY: FR-005 AC-017
  it("cria setup-gate.sh para claude-code mas nunca para antigravity", () => {
    const rootClaude = freshProject();
    runSetup({ env: claudeEnv, root: rootClaude, write: true, target: "claude-code" });
    expect(existsSync(resolve(rootClaude, ".maestro", "hooks", "setup-gate.sh"))).toBe(true);

    const rootAntigravity = freshProject();
    runSetup({ env: claudeEnv, root: rootAntigravity, write: true, target: "antigravity" });
    expect(existsSync(resolve(rootAntigravity, ".maestro", "hooks", "setup-gate.sh"))).toBe(false);
  });
});
