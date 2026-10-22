import { describe, it, expect } from "vitest";
import { renderPlan } from "../src/approval/render";

const PLANO = [
  { name: "guard-secrets", target: ".claude/settings.json", event: "PreToolUse" },
  { name: "context-mode-stop", target: ".claude/settings.json", event: "Stop" },
];

describe("AC-069 — texto e documento contam a mesma história", () => {
  // TRACEABILITY: US-062 FR-063 NFR-062 AC-069
  it("os hooks nomeados coincidem nos dois", () => {
    const r = renderPlan(PLANO);
    const doc = JSON.parse(r.document) as { items: { name: string }[] };
    const nomesTexto = PLANO.map((p) => p.name);
    const nomesDoc = doc.items.map((i) => i.name);
    for (const n of nomesTexto) {
      expect(r.text).toContain(n);
      expect(nomesDoc).toContain(n);
    }
  });

  // TRACEABILITY: US-062 FR-063 NFR-062 AC-069
  it("os destinos e eventos coincidem nos dois", () => {
    const r = renderPlan(PLANO);
    const doc = JSON.parse(r.document) as { items: { name: string; target: string; event: string }[] };
    for (const item of PLANO) {
      expect(r.text).toContain(item.event);
      const noDoc = doc.items.find((i) => i.name === item.name);
      expect(noDoc?.target).toBe(item.target);
      expect(noDoc?.event).toBe(item.event);
    }
  });

  // TRACEABILITY: US-062 NFR-062 AC-069
  it("a quantidade de itens é a mesma nas duas formas", () => {
    const r = renderPlan(PLANO);
    const doc = JSON.parse(r.document) as { items: unknown[] };
    expect(doc.items.length).toBe(PLANO.length);
  });
});
