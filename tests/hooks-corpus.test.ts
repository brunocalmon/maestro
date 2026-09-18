import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode, unwrap } from "../src/hooks/claude-code";

const CORPUS = resolve(__dirname, "../resources/hooks");
const names = () =>
  readdirSync(CORPUS).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.slice(0, -3));

describe("AC-013 — the seven real hooks survive the round trip", () => {
  // SPECSFY: US-002 FR-005 AC-013
  it("finds exactly the ported hooks", () => {
    // SPEC-0022 replaced the three context-mode Markdown hooks by the upstream
    // projection; SPEC-0023 added guard-docs, graph-hint and code-review-graph-stop;
    // SPEC-0024 added skills-project and skills-project-session; SPEC-0026
    // added setup-gate and guard-defer-conversational.
    expect(names()).toHaveLength(12);
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-013
  it("recovers the seven scripts identical to the originals", () => {
    // SPEC-0022: the settings entry now carries a reference to the script
    // file; the round trip is checked on the script body itself.
    for (const n of names()) {
      const original = readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      const t = translateForClaudeCode(original);
      const back = t.kind === "script" ? unwrap(t.scriptBody ?? "") : t.command.replace(/ # maestro:hook=\S+$/, "");
      expect(back, `hook ${n} corrupted in translation`).toBe(original.script);
    }
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-013
  it("preserves the count of hostile characters in each one", () => {
    const hostile = (s: string) => (s.match(/["'\\$]/g) ?? []).length;
    for (const n of names()) {
      const original = readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      const t = translateForClaudeCode(original);
      const back = t.kind === "script" ? unwrap(t.scriptBody ?? "") : t.command.replace(/ # maestro:hook=\S+$/, "");
      expect(hostile(back), `hook ${n}`).toBe(hostile(original.script));
    }
  });
});

describe("AC-021 (SPEC-0022) — round-trip do fragmento é fiel byte a byte", () => {
  // SPECSFY: NFR-003 FR-002 FR-005 AC-021
  it("scripts recuperam o bloco original; despachos não recebem wrapper", () => {
    for (const n of names()) {
      const original = readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      const t = translateForClaudeCode(original);
      const hasBlock = /```(?:bash|sh|shell)?\n/.test(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      if (hasBlock) {
        expect(t.kind, n).toBe("script");
        expect(unwrap(t.scriptBody ?? ""), `hook ${n} corrompido`).toBe(original.script);
        expect(t.command).toBe(`"$CLAUDE_PROJECT_DIR/.maestro/hooks/${n}.sh"`);
      } else {
        expect(t.kind, n).toBe("dispatch");
        expect(t.scriptBody).toBeUndefined();
        expect(t.command).not.toContain("hook fragment");
      }
    }
  });
});
