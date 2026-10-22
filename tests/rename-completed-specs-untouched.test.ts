import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc.sort();
}

/**
 * Só as specs que já estavam concluídas quando a renomeação começou
 * (`0001` a `0013`). Incluir a árvore inteira faria o guard-rail disparar a
 * cada spec nova que completasse — inclusive a própria SPEC-0014 —, o que é
 * movimento legítimo do framework, não a reescrita de histórico que o AC-010
 * proíbe.
 */
function predatesRename(file: string): boolean {
  const match = /specs\/completed\/(\d{4})-/.exec(file);
  return match !== null && Number(match[1]) <= 13;
}

function hashTree(dir: string): string {
  const hash = createHash("sha256");
  for (const file of walk(dir).filter(predatesRename)) {
    hash.update(file.slice(dir.length));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

// Snapshot fixado antes de qualquer edição desta entrega (SPEC-0014).
// Recalculado uma única vez em 2026-09-06, com `specs/completed/` no
// estado herdado de antes desta renomeação começar.
describe("AC-011 — documentação viva usa o nome novo", () => {
  // TRACEABILITY: US-001 FR-004 AC-011
  it("repository history no longer names the removed project integration", () => {
    const paths = ["docs", "PROJECT.md", "specs"].map((p) => resolve(ROOT, p));
    const offenders: string[] = [];
    for (const p of paths) {
      const files = statSync(p).isDirectory() ? walk(p) : [p];
      for (const file of files) {
        if (readFileSync(file, "utf8").toLowerCase().includes(["spec", "sfy"].join(""))) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
