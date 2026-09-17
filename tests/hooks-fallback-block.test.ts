import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import * as router from "../src/extensions/router";
import { claudeEnv, project } from "./helpers-spec-0022";

const build = (): string => (router as unknown as { buildHooksFallbackBlock?: () => string }).buildHooksFallbackBlock?.() ?? "";
const HOOKS = ["guard-destructive", "guard-secrets", "protect-authorship", "code-review-graph-update", "guard-docs"];

describe("AC-014 — bloco hooks-fallback com até três regras condicionais", () => {
  // SPECSFY: US-004 FR-005 NFR-003 AC-014
  it("≤3 itens, cada um cita um hook e maestro doctor, nenhum descreve o comando", () => {
    const text = build();
    expect(text.length).toBeGreaterThan(0);
    const items = text.split("\n").filter((l) => /^\s*(-|\d+\.)\s/.test(l));
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(3);
    for (const item of items) {
      expect(item).toMatch(/maestro doctor/);
      expect(HOOKS.some((h) => item.includes(h)), item).toBe(true);
      expect(item).not.toMatch(/update --brief|rm -rf|exit 2|sha256/);
    }
  });
});

describe("AC-015 — bloco instalado uma vez e idempotente", () => {
  // SPECSFY: US-004 FR-005 NFR-003 AC-015
  it("dois setups deixam um único bloco e um único artefato registrado", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    const claude = readFileSync(resolve(root, "CLAUDE.md"), "utf8") + (existsSync(resolve(root, "AGENTS.md")) ? readFileSync(resolve(root, "AGENTS.md"), "utf8") : "");
    expect(claude.match(/extension:hooks-fallback:start/g) ?? []).toHaveLength(1);
    const registry = JSON.parse(readFileSync(resolve(root, ".maestro", "extensions.json"), "utf8")) as { artifacts: { name: string }[] };
    expect(registry.artifacts.filter((a) => a.name === "hooks-fallback")).toHaveLength(1);
  });
});

describe("AC-016 — bloco separado do router", () => {
  // SPECSFY: US-004 FR-005 NFR-003 AC-016
  it("router já registrado permanece intacto quando o bloco novo entra", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    const registry = JSON.parse(readFileSync(resolve(root, ".maestro", "extensions.json"), "utf8")) as { artifacts: { name: string; checksum: string; content: string }[] };
    const routerArtifact = registry.artifacts.find((a) => a.name === "router");
    const fallback = registry.artifacts.find((a) => a.name === "hooks-fallback");
    expect(routerArtifact).toBeDefined();
    expect(fallback).toBeDefined();
    expect(fallback!.content).not.toBe(routerArtifact!.content);
    expect(routerArtifact!.content).toBe(router.buildRouterBlock());
  });
});
